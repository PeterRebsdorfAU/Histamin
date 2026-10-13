// Mad-tjek: analysér fri tekst om hvad man har spist, og gem resultatet på dagen.

import { FOODS, FOOD_BY_ID } from '../data/foods.js';
import { get, put, newId } from './db.js';

export const LEVELS = {
  lav: { label: 'Lavt histamin', short: 'Lavt', emoji: '🟢', r: 0 },
  middel: { label: 'Middel histamin', short: 'Middel', emoji: '🟠', r: 2 },
  høj: { label: 'Højt histamin', short: 'Højt', emoji: '🔴', r: 3 },
};

// Personlige noter vinder: har man noteret "reagerer", tæller den som 3.
const effective = (it) => (it.foodId && get('foodNotes', it.foodId)?.status === 'reaction' ? 3 : it.rating);

export function levelOf(items) {
  const rs = items.map(effective);
  if (rs.some((r) => r >= 3)) return 'høj';
  if (rs.some((r) => r === 2) || rs.filter((r) => r === 1).length >= 3) return 'middel';
  return 'lav';
}

// ---------- Analyse ----------

export async function analyzeText(text) {
  try {
    const res = await fetch('/api/ai/meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) return { ...(await res.json()), source: 'ai' };
    if (res.status !== 503) {
      const err = await res.json().catch(() => ({}));
      return { ...localAnalyze(text), source: 'local', note: err.error || 'AI-tjekket fejlede – viser simpelt opslag i stedet.' };
    }
  } catch {
    return { ...localAnalyze(text), source: 'local', note: 'Ingen forbindelse til serveren – viser simpelt opslag i stedet.' };
  }
  return { ...localAnalyze(text), source: 'local' };
}

// Reserve uden AI: find fødevarer fra listen, hvis navn/søgeord står i teksten.
const STOP = new Set(['frisk', 'friske', 'frossen', 'frosne', 'købt', 'købte', 'alle', 'typer', 'andre', 'eller', 'over', 'døgn', 'naturel', 'hele', 'kogt', 'kogte', 'mange']);
const norm = (s) => s.toLowerCase().replace(/[^a-zæøå0-9]+/g, ' ');
const TOKENS = FOODS.map((f) => ({
  f,
  tokens: [...new Set(norm(`${f.name} ${f.alias || ''}`).split(' ').filter((t) => t.length >= 3 && !STOP.has(t)))],
}));

export function localAnalyze(text) {
  const words = norm(text).split(' ').filter(Boolean);
  const found = new Map();
  for (const w of words) {
    if (w.length < 3) continue;
    // Hele ord eller sammensatte ord (fx "rugbrødsmad" → "rugbrød")
    const cands = TOKENS.filter(({ tokens }) => tokens.some((t) => w === t || (t.length >= 4 && w.startsWith(t))));
    if (!cands.length) continue;
    const best = cands.sort((a, b) => Number(norm(b.f.name).startsWith(w)) - Number(norm(a.f.name).startsWith(w)) || a.f.name.length - b.f.name.length)[0].f;
    if (!found.has(best.id)) found.set(best.id, { name: best.name, foodId: best.id, rating: best.r, reason: '' });
  }
  const items = [...found.values()];
  return {
    items,
    summary: items.length
      ? 'Simpelt opslag i fødevarelisten (uden AI). Sammensatte retter som lasagne eller pizza bliver ikke delt op.'
      : 'Fandt ingen kendte fødevarer i teksten. Prøv at skrive de enkelte ingredienser.',
    tips: [],
  };
}

// ---------- Gem på dagen ----------

export const checksOf = (log) => (Array.isArray(log?.foodChecks) ? log.foodChecks : []);

function derive(foodChecks) {
  const items = foodChecks.flatMap((c) => c.items || []);
  const level = items.length ? levelOf(items) : null;
  return {
    foodChecks,
    histamine: level,
    // Det appen "selv udfylder": problematiske fødevarer og om kosten blev holdt
    offPlanFoods: [...new Set(items.filter((i) => i.foodId && effective(i) >= 2).map((i) => i.foodId))],
    onPlan: level == null ? null : level === 'lav' ? 'ja' : level === 'middel' ? 'delvist' : 'nej',
  };
}

export function saveCheck(date, text, result) {
  const log = get('logs', date) || {};
  const check = {
    id: newId(),
    at: Date.now(),
    text,
    items: result.items,
    summary: result.summary,
    tips: result.tips || [],
    source: result.source,
  };
  put('logs', date, { ...log, ...derive([...checksOf(log), check]) });
  return check;
}

export function removeCheck(date, id) {
  const log = get('logs', date) || {};
  put('logs', date, { ...log, ...derive(checksOf(log).filter((c) => c.id !== id)) });
}

export const foodName = (it) => (it.foodId ? FOOD_BY_ID[it.foodId]?.name : null) || it.name;
