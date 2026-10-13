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
const FOOD_LIST = FOODS.map((f) => `${f.id}|${f.name}|${f.r}`).join('\n');

const PROMPT = `Du hjælper en person i et 14-dages lavhistamin-kostforsøg (pga. hovedpine).
Personen skriver, hvad vedkommende har spist og drukket. Din opgave:
1. Del teksten op i de enkelte fødevarer og drikkevarer. Sammensatte retter (fx lasagne, pizza, sushi, burger)
   skal deles op i de ingredienser der har betydning for histamin (fx lasagne → pasta, hakket oksekød, tomat, lagret ost).
2. Find for hver det bedst matchende id i FØDEVARELISTEN nedenfor (format: id|navn|vurdering). Brug null hvis intet passer.
3. Giv vurdering 0–3 efter samme skala som listen: 0 = tåles godt, 1 = små mængder ok, 2 = undgå, 3 = undgå helt.
   Hvis du har valgt et id, SKAL vurderingen være listens vurdering.
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
    generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0.2 },
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

async function callWithRetry(body) {
  const deadline = Date.now() + 55000;
  let lastErr;
  for (const model of [MODEL, ...FALLBACKS]) {
    // Hovedmodellen får 3 forsøg, reserver 2
    const attempts = model === MODEL ? 3 : 2;
    for (let i = 0; i < attempts; i++) {
      if (Date.now() > deadline - 3000) break;
      try {
        return await callGemini(model, body, deadline);
      } catch (err) {
        lastErr = err;
        if (err.status === 404) break; // modellen findes ikke → næste model
        if (!RETRYABLE.has(err.status)) throw err; // fx forkert nøgle – nytter ikke at prøve igen
        if (err.status === 429) break; // kvote → prøv reserve-model med det samme
        if (i < attempts - 1) await sleep(1200 * (i + 1));
      }
    }
  }
  throw lastErr || new Error('Gemini kunne ikke nås');
}

async function callGemini(model, body, deadline) {
  let res;
  try {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      // Nøglen sendes som header (ikke i URL'en, så den ikke havner i logs).
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(Math.max(5000, deadline - Date.now())),
    });
  } catch (err) {
    const e = new Error(err.name === 'TimeoutError' ? 'Gemini svarede ikke i tide' : `Kunne ikke kontakte Gemini (${err.message})`);
    e.status = 504;
    throw e;
  }
  const payload = await res.text();
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
