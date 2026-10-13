// AI-tjek af hvad man har spist: fri tekst ind → vurdering pr. fødevare ud.
//
// Samme opsætning som IndkøbsApp: Google Gemini via REST med struktureret JSON-svar.
// DVALE: Uden API-nøgle er featuren slået fra (appen falder tilbage til et simpelt
// lokalt opslag i fødevarelisten). Nøglen sættes KUN som env-var på Render:
//   GEMINI_API_KEY  (eller Gemini__ApiKey, som i IndkøbsApp)
//   GEMINI_MODEL    (valgfri, default "gemini-flash-latest")

import { FOODS, FOOD_BY_ID } from '../src/data/foods.js';

const API_KEY = process.env.GEMINI_API_KEY || process.env.Gemini__ApiKey || '';
const MODEL = process.env.GEMINI_MODEL || process.env.Gemini__Model || 'gemini-flash-latest';
// Reserve-modeller, hvis hovedmodellen er overbelastet (503) eller kvoten er brugt (429).
// Kommasepareret; sæt GEMINI_FALLBACK_MODELS="" for at slå fra.
const FALLBACKS = (process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-flash-lite-latest')
  .split(',').map((m) => m.trim()).filter((m) => m && m !== MODEL);

export const aiEnabled = () => !!API_KEY;

// Fødevarelisten sendes med, så modellen bruger APPENS vurderinger og id'er.
// Vurderingen sendes ikke med – serveren sætter den alligevel ud fra id'et (kortere prompt = hurtigere svar).
const FOOD_LIST = FOODS.map((f) => `${f.id}|${f.name}`).join('\n');

const PROMPT = `Du hjælper en person i et 14-dages lavhistamin-kostforsøg (pga. hovedpine).
Personen skriver, hvad vedkommende har spist og drukket. Din opgave:
1. Del teksten op i de enkelte fødevarer og drikkevarer. Sammensatte retter (fx lasagne, pizza, sushi, burger)
   skal deles op i de ingredienser der har betydning for histamin (fx lasagne → pasta, hakket oksekød, tomat, lagret ost).
2. Find for hver det bedst matchende id i FØDEVARELISTEN nedenfor (format: id|navn). Brug null hvis intet passer.
3. Giv vurdering 0–3: 0 = tåles godt, 1 = små mængder ok, 2 = undgå, 3 = undgå helt.
   Tag højde for friskhed: rester der har stået > 1 døgn, røget, modnet, fermenteret, syltet og færdigmad er værre.
4. "reason": kort forklaring på dansk (max 12 ord), fx "Lagret ost – meget histamin".
5. "summary": 1–2 venlige sætninger på dansk om dagens samlede histamin-belastning.
6. "tips": 0–2 korte konkrete forslag på dansk til lavhistamin-alternativer for de værste ting. Tom liste hvis alt er fint.
Svar KUN med JSON efter skemaet.

FØDEVARELISTE:
${FOOD_LIST}`;

// Gemini REST forventer typerne med STORE bogstaver (OpenAPI-subset: OBJECT, STRING, ...).
const SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          foodId: { type: 'STRING', nullable: true },
          rating: { type: 'INTEGER' },
          reason: { type: 'STRING' },
        },
        required: ['name', 'rating'],
      },
    },
    summary: { type: 'STRING' },
    tips: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['items', 'summary'],
};

export async function analyzeMeal(text) {
  if (!API_KEY) throw new Error('AI er ikke konfigureret');

  const body = {
    contents: [{ parts: [{ text: `${PROMPT}

DET PERSONEN HAR SPIST:
${text}` }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 4096,
      // thinkingConfig sættes pr. model i callWithRetry (se THINKING_VARIANTS)
    },
  };

  const payload = await callWithRetry(body);
  const data = JSON.parse(payload);
  const cand = data?.candidates?.[0];
  const textOut = (cand?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || '').join('').trim();
  if (!textOut) {
    console.warn('Tomt Gemini-svar:', payload.slice(0, 1000));
    const why = cand?.finishReason || data?.promptFeedback?.blockReason || 'ukendt';
    throw new Error(`Gemini gav et tomt svar (årsag: ${why})`);
  }
  // Fjern evt. ```json-indpakning, hvis modellen ignorerer JSON-formatet
  const cleaned = textOut.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return sanitize(JSON.parse(cleaned));
  } catch {
    console.warn('Ugyldigt JSON fra Gemini:', cleaned.slice(0, 500));
    throw new Error('Gemini svarede ikke med gyldigt JSON');
  }
}

// Gemini er ofte kortvarigt overbelastet. Prøv igen med pause, og skift derefter til en reserve-model.
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const TOTAL_MS = 60000; // samlet ventetid for brugeren
const ATTEMPT_MS = Number(process.env.GEMINI_ATTEMPT_MS) || 45000; // max pr. forsøg

// Opgaven kræver ingen lang "tænkning" – den gør bare svaret langsomt. Men modellerne
// styrer det forskelligt (Gemini 2.5: thinkingBudget, Gemini 3: thinkingLevel), og en
// forkert indstilling giver en generisk 400-fejl. Vi prøver derfor varianterne i
// rækkefølge og husker, hvilken der virkede for hver model.
const THINKING_VARIANTS = [{ thinkingBudget: 0 }, { thinkingLevel: 'minimal' }, { thinkingLevel: 'low' }, null];
const variantFor = new Map(); // model → indeks i THINKING_VARIANTS

const withThinking = (body, variant) => ({
  ...body,
  generationConfig: { ...body.generationConfig, ...(variant ? { thinkingConfig: variant } : {}) },
});

// "Hedging": Hovedmodellen starter med det samme. Har den ikke svaret efter HEDGE_MS,
// startes næste model ved siden af – og så fremdeles. Første gyldige svar vinder, og de
// andre forespørgsler afbrydes. Det giver hurtige svar, selv når én model er presset.
const HEDGE_MS = Number(process.env.GEMINI_HEDGE_MS) || 6000;

async function callWithRetry(body) {
  const deadline = Date.now() + TOTAL_MS;
  const models = [MODEL, ...FALLBACKS];
  const stop = new AbortController();
  let done = false;

  const lane = async (model, delay) => {
    await sleep(delay);
    let lastErr = new Error('Gemini kunne ikke nås');
    for (let attempt = 0; attempt < 4; attempt++) {
      if (done || Date.now() > deadline - 2000) break;
      const v = variantFor.get(model) ?? 0;
      try {
        const payload = await callGemini(model, withThinking(body, THINKING_VARIANTS[v]), deadline, stop.signal);
        variantFor.set(model, v);
        return payload;
      } catch (err) {
        lastErr = err;
        if (done || err.aborted) break;
        // 400 skyldes sandsynligvis thinking-indstillingen → prøv næste variant på samme model
        if (err.status === 400 && !/api key/i.test(err.message) && v < THINKING_VARIANTS.length - 1) {
          console.warn(`Gemini (${model}): thinking-variant ${JSON.stringify(THINKING_VARIANTS[v])} afvist – prøver næste`);
          variantFor.set(model, v + 1);
          continue;
        }
        if (!RETRYABLE.has(err.status) || err.status === 429 || err.timeout) break;
        await sleep(1500 * (attempt + 1)); // 503 o.l. → kort pause og prøv igen
      }
    }
    throw lastErr;
  };

  try {
    const payload = await Promise.any(models.map((m, i) => lane(m, i * HEDGE_MS)));
    return payload;
  } catch (agg) {
    const errs = agg.errors || [agg];
    // En "rigtig" fejl (fx forkert nøgle) er mere nyttig end en timeout
    throw errs.find((e) => e.status && !RETRYABLE.has(e.status)) || errs.find((e) => e.status === 503) || errs[0];
  } finally {
    done = true;
    stop.abort();
  }
}

async function callGemini(model, body, deadline, stopSignal) {
  const started = Date.now();
  let res;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      // Nøglen sendes som header (ikke i URL'en, så den ikke havner i logs).
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.any([
        stopSignal,
        AbortSignal.timeout(Math.max(3000, Math.min(ATTEMPT_MS, deadline - Date.now()))),
      ]),
    });
  } catch (err) {
    if (stopSignal.aborted) {
      const e = new Error('Afbrudt – en anden model svarede først');
      e.aborted = true;
      throw e;
    }
    const timeout = err.name === 'TimeoutError';
    console.warn(`Gemini (${model}) ${timeout ? 'timeout' : 'netværksfejl'} efter ${Date.now() - started} ms`);
    const e = new Error(timeout ? 'Gemini svarede ikke i tide – prøv igen om lidt' : `Kunne ikke kontakte Gemini (${err.message})`);
    e.status = 504;
    e.timeout = timeout;
    throw e;
  }
  const payload = await res.text();
  console.log(`Gemini (${model}) svarede ${res.status} efter ${Date.now() - started} ms`);
  if (!res.ok) {
    console.warn(`Gemini-kald fejlede (${model}):`, res.status, payload.slice(0, 500));
    // Googles egen fejlbesked (indeholder aldrig nøglen) – gør fejlfinding mulig fra appen
    let msg = '';
    try { msg = JSON.parse(payload)?.error?.message || ''; } catch { /* ikke JSON */ }
    const e = new Error(`Gemini svarede ${res.status}${msg ? `: ${msg.slice(0, 300).replace(/[.\s]+$/, '')}` : ''}`);
    e.status = res.status;
    throw e;
  }
  return payload;
}

// Defensiv oprydning: kun kendte id'er, og listens vurdering vinder altid.
export function sanitize(raw) {
  const items = (Array.isArray(raw?.items) ? raw.items : [])
    .filter((it) => it && typeof it.name === 'string' && it.name.trim())
    .slice(0, 40)
    .map((it) => {
      const food = it.foodId ? FOOD_BY_ID[it.foodId] : null;
      const r = food ? food.r : Math.min(3, Math.max(0, Math.round(Number(it.rating) || 0)));
      return {
        name: it.name.trim().slice(0, 80),
        foodId: food ? food.id : null,
        rating: r,
        reason: typeof it.reason === 'string' ? it.reason.trim().slice(0, 120) : '',
      };
    });
  return {
    items,
    summary: typeof raw?.summary === 'string' ? raw.summary.trim().slice(0, 400) : '',
    tips: (Array.isArray(raw?.tips) ? raw.tips : []).filter((t) => typeof t === 'string').slice(0, 3).map((t) => t.slice(0, 200)),
  };
}

// Simpel beskyttelse af API-kvoten (appen har intet login).
const hits = new Map();
export function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
  if (arr.length >= 40) return true;
  arr.push(now);
  hits.set(ip, arr);
  return false;
}
