// Automatisk madplan: varierer proteinkilden, undgår gentagelser,
// lægger hurtige retter på hverdage og prioriterer retter I har kunnet lide.

import { fromKey, today } from './dates.js';
import { allRecipes, recipeOpinion, recipeRating } from './recipes.js';
import { get, put } from './db.js';

const RED = new Set(['okse', 'svin', 'lam']);

export function generatePlan(dates, { overwrite = false } = {}) {
  const pool = allRecipes().filter((r) => recipeOpinion(r.id)?.vote !== 'down' && recipeRating(r) <= 1);
  if (!pool.length) return 0;

  const used = new Map();
  const assigned = {};
  for (const d of dates) {
    const e = get('plan', d);
    if ((e?.recipeId || e?.text) && !overwrite) {
      assigned[d] = e.recipeId || '__text';
      if (e.recipeId) used.set(e.recipeId, (used.get(e.recipeId) || 0) + 1);
    }
  }

  let count = 0;
  let fishThisWeek = 0;
  dates.forEach((d, idx) => {
    if (idx % 7 === 0) fishThisWeek = 0;
    if (assigned[d]) {
      const r = pool.find((x) => x.id === assigned[d]);
      if (r?.protein === 'fisk') fishThisWeek++;
      return;
    }
    const prev = pool.find((x) => x.id === assigned[dates[idx - 1]]);
    const prev2 = pool.find((x) => x.id === assigned[dates[idx - 2]]);
    const dow = fromKey(d).getDay(); // 0 = søndag
    const weekday = dow >= 1 && dow <= 4;
    const weekend = dow === 5 || dow === 6 || dow === 0;

    const scored = pool.map((r) => {
      let s = Math.random() * 3;
      s -= (used.get(r.id) || 0) * 20;
      if (prev && prev.protein === r.protein) s -= 8;
      if (prev2 && prev2.protein === r.protein) s -= 3;
      if (prev && RED.has(prev.protein) && RED.has(r.protein)) s -= 5;
      if (r.protein === 'fisk' && fishThisWeek < 2) s += 4;
      if (r.protein === 'fisk' && fishThisWeek >= 3) s -= 6;
      if (r.protein === 'svin') s -= 2; // svinekød er "1" – lidt sjældnere
      if (weekday && (r.time || 40) <= 35) s += 2;
      if (weekday && (r.time || 40) >= 55) s -= 3;
      if (weekend && (r.id === 'hvid-pizza' || r.id === 'burgere' || r.id === 'svinemoerbrad' || r.id === 'lammekoteletter')) s += 3;
      if (recipeOpinion(r.id)?.vote === 'up') s += 3;
      if (d === today() && r.thaw) s -= 10; // ingen tid til at optø i køleskab
      return { r, s };
    }).sort((a, b) => b.s - a.s);

    const pick = scored[0].r;
    assigned[d] = pick.id;
    used.set(pick.id, (used.get(pick.id) || 0) + 1);
    if (pick.protein === 'fisk') fishThisWeek++;
    const existing = get('plan', d);
    put('plan', d, { ...(existing || {}), recipeId: pick.id, text: '' });
    count++;
  });
  return count;
}
