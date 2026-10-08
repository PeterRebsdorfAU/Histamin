// Beregninger til "Fremskridt": hovedpine over tid, uge 1 vs. uge 2,
// og simple mønstre (ikke statistik – bare observationer).

import { SYMPTOMS } from '../data/guide.js';
import { FOOD_BY_ID } from '../data/foods.js';
import { get, getSettings } from './db.js';
import { addDays, range, today, diffDays } from './dates.js';

export const headacheOf = (log) => {
  if (!log) return null;
  const eps = (log.episodes || []).map((e) => Number(e.intensity) || 0);
  const vals = [...eps, Number.isFinite(log.headache) ? log.headache : -1].filter((v) => v >= 0);
  return vals.length ? Math.max(...vals) : null;
};

// Er dagen "udfyldt"? (har man taget stilling til hovedpine)
export const isLogged = (log) => !!log && (Number.isFinite(log.headache) || (log.episodes || []).length > 0);

// Er hele dagbogen udfyldt? (hovedpine + kost + søvn)
export const dayComplete = (log) => isLogged(log) && !!log.onPlan && log.sleepHours != null;

export function trialInfo() {
  const s = getSettings();
  if (!s.startDate) return { started: false, dates: [], dayNo: 0, total: s.days };
  const dates = range(s.startDate, s.days);
  const t = today();
  const dayNo = diffDays(s.startDate, t) + 1;
  return {
    started: dayNo >= 1,
    finished: dayNo > s.days,
    dayNo,
    total: s.days,
    dates,
    endDate: addDays(s.startDate, s.days - 1),
    daysUntil: dayNo < 1 ? 1 - dayNo : 0,
  };
}

export function computeInsights() {
  const s = getSettings();
  const info = trialInfo();
  const t = today();
  const days = info.dates.filter((d) => d <= t).map((d, idx) => {
    const log = get('logs', d);
    return { date: d, idx, log, logged: isLogged(log), h: headacheOf(log) };
  });
  const logged = days.filter((d) => d.logged);

  const stats = (arr) => {
    const hd = arr.filter((d) => d.h > 0);
    return {
      n: arr.length,
      headacheDays: hd.length,
      avgIntensity: hd.length ? hd.reduce((a, d) => a + d.h, 0) / hd.length : 0,
      meds: arr.reduce((a, d) => a + (Number(d.log?.meds) || 0), 0),
      wellbeing: avg(arr.map((d) => d.log?.wellbeing).filter(Boolean)),
    };
  };

  const half = Math.ceil(s.days / 2);
  const first = logged.filter((d) => d.idx < half);
  const second = logged.filter((d) => d.idx >= half);

  const onPlanDays = logged.filter((d) => d.log.onPlan === 'ja').length;
  const planAnswered = logged.filter((d) => d.log.onPlan).length;

  // Symptomer: antal dage med hvert symptom
  const symptomCounts = SYMPTOMS.map((sym) => ({
    ...sym,
    days: logged.filter((d) => (d.log.symptoms?.[sym.id] || 0) > 0).length,
    byDay: days.map((d) => d.log?.symptoms?.[sym.id] || 0),
  }));

  return {
    info,
    days,
    logged,
    all: stats(logged),
    first: stats(first),
    second: stats(second),
    half,
    adherence: planAnswered ? onPlanDays / planAnswered : null,
    symptomCounts,
    patterns: findPatterns(logged),
    baseline: s.baselineDays != null ? { days: s.baselineDays, intensity: s.baselineIntensity } : null,
  };
}

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

// Sammenlign hovedpine på dage MED en faktor vs. dage UDEN.
// For mad ser vi på samme dag og dagen efter (histamin-reaktioner kan komme forsinket).
function findPatterns(logged) {
  const byDate = Object.fromEntries(logged.map((d) => [d.date, d]));
  const hasHeadacheSameOrNext = (d) => d.h > 0 || (byDate[addDays(d.date, 1)]?.h || 0) > 0;
  const out = [];

  const compare = (label, pred, { lagged = false, hint } = {}) => {
    const withF = logged.filter(pred);
    const without = logged.filter((d) => !pred(d));
    if (withF.length < 1 || without.length < 1) return;
    const hit = (d) => (lagged ? hasHeadacheSameOrNext(d) : d.h > 0);
    const a = withF.filter(hit).length / withF.length;
    const b = without.filter(hit).length / without.length;
    out.push({ label, withN: withF.length, withRate: a, withoutN: without.length, withoutRate: b, diff: a - b, lagged, hint });
  };

  compare('Dage hvor kosten blev brudt', (d) => d.log.onPlan === 'delvist' || d.log.onPlan === 'nej', { lagged: true, hint: 'Hovedpine samme dag eller dagen efter.' });
  compare('Under 6½ times søvn', (d) => d.log.sleepHours != null && d.log.sleepHours < 6.5);
  compare('Høj stress (4–5)', (d) => (d.log.stress || 0) >= 4);
  compare('Under 6 glas vand', (d) => d.log.water != null && d.log.water < 6);
  compare('Menstruation', (d) => !!d.log.period);
  compare('Mere kaffe end normalt (3+ kopper)', (d) => (d.log.coffee || 0) >= 3);

  // Specifikke fødevarer, der er spist uden for planen
  const foodCount = {};
  for (const d of logged) for (const f of d.log.offPlanFoods || []) (foodCount[f] ||= []).push(d);
  const foods = Object.entries(foodCount).map(([f, ds]) => ({
    food: FOOD_BY_ID[f], foodId: f, times: ds.length, followed: ds.filter(hasHeadacheSameOrNext).length,
  })).filter((x) => x.food).sort((a, b) => b.followed / b.times - a.followed / a.times);

  return { factors: out.sort((a, b) => b.diff - a.diff), foods };
}

export const pct = (x) => `${Math.round(x * 100)} %`;
export const one = (x) => (x == null ? '–' : (Math.round(x * 10) / 10).toString().replace('.', ','));
