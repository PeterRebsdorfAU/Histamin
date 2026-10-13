// Beregninger til "Fremskridt": hovedpine over tid, første vs. anden halvdel,
// og sammenhæng mellem histamin i maden (fra Mad-tjek) og hovedpine.

import { FOOD_BY_ID } from '../data/foods.js';
import { get, getSettings } from './db.js';
import { addDays, range, today, diffDays } from './dates.js';

export const headacheOf = (log) => {
  if (!log) return null;
  const eps = (log.episodes || []).map((e) => Number(e.intensity) || 0);
  const vals = [...eps, Number.isFinite(log.headache) ? log.headache : -1].filter((v) => v >= 0);
  return vals.length ? Math.max(...vals) : null;
};

// Har man taget stilling til hovedpine den dag?
export const isLogged = (log) => !!log && (Number.isFinite(log.headache) || (log.episodes || []).length > 0);

export function trialInfo() {
  const s = getSettings();
  if (!s.startDate) return { started: false, dates: [], dayNo: 0, total: s.days };
  const dates = range(s.startDate, s.days);
  const dayNo = diffDays(s.startDate, today()) + 1;
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
    return { date: d, idx, log, logged: isLogged(log), h: headacheOf(log), histamine: log?.histamine || null };
  });
  const logged = days.filter((d) => d.logged);

  const stats = (arr) => {
    const hd = arr.filter((d) => d.h > 0);
    return {
      n: arr.length,
      headacheDays: hd.length,
      avgIntensity: hd.length ? hd.reduce((a, d) => a + d.h, 0) / hd.length : 0,
      meds: arr.reduce((a, d) => a + (Number(d.log?.meds) || 0), 0),
    };
  };

  const half = Math.ceil(s.days / 2);
  const withFood = logged.filter((d) => d.histamine);

  return {
    info,
    days,
    logged,
    all: stats(logged),
    first: stats(logged.filter((d) => d.idx < half)),
    second: stats(logged.filter((d) => d.idx >= half)),
    half,
    lowFoodShare: withFood.length ? withFood.filter((d) => d.histamine === 'lav').length / withFood.length : null,
    foodDays: withFood.length,
    patterns: findPatterns(logged),
    baseline: s.baselineDays != null ? { days: s.baselineDays, intensity: s.baselineIntensity } : null,
  };
}

// Histamin-reaktioner kan komme forsinket – derfor ser vi på samme dag og dagen efter.
function findPatterns(logged) {
  const byDate = Object.fromEntries(logged.map((d) => [d.date, d]));
  const hit = (d) => d.h > 0 || (byDate[addDays(d.date, 1)]?.h || 0) > 0;

  const high = logged.filter((d) => d.histamine === 'middel' || d.histamine === 'høj');
  const low = logged.filter((d) => d.histamine === 'lav');
  const histamine = high.length && low.length
    ? { withN: high.length, withRate: high.filter(hit).length / high.length, withoutN: low.length, withoutRate: low.filter(hit).length / low.length }
    : null;

  const count = {};
  for (const d of logged) for (const f of d.log.offPlanFoods || []) (count[f] ||= []).push(d);
  const foods = Object.entries(count)
    .map(([f, ds]) => ({ food: FOOD_BY_ID[f], foodId: f, times: ds.length, followed: ds.filter(hit).length }))
    .filter((x) => x.food)
    .sort((a, b) => b.followed / b.times - a.followed / a.times || b.times - a.times);

  return { histamine, foods };
}

export const pct = (x) => `${Math.round(x * 100)} %`;
export const one = (x) => (x == null ? '–' : (Math.round(x * 10) / 10).toString().replace('.', ','));
