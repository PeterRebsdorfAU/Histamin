// Lokal-først datalager.
//
// Alt gemmes i localStorage og virker uden net. Hvis enheden er koblet til et
// "delt rum" (space), synkroniseres ændringer med serveren, så I begge ser den
// samme madplan, indkøbsliste og dagbog.
//
// Hver post har { id, updatedAt, deleted? }. Ved konflikt vinder den nyeste.

import { useSyncExternalStore } from 'react';

const DB_KEY = 'histamin.db.v1';
const META_KEY = 'histamin.meta.v1';

export const COLLECTIONS = [
  'settings', 'plan', 'logs', 'shopManual', 'shopChecks', 'customRecipes',
  'foodNotes', 'recipeNotes', 'freezer', 'tests',
];

const load = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

let db = load(DB_KEY, {});
for (const c of COLLECTIONS) db[c] ||= {};

// meta = lokale indstillinger for netop denne enhed (deles ikke)
let meta = load(META_KEY, { space: null, cursor: 0, outbox: {}, lastSync: null, syncError: null, theme: 'auto' });

const listeners = new Set();
let version = 0;
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

let saveTimer = null;
const save = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch (e) {
      console.warn('Kunne ikke gemme lokalt', e);
    }
  }, 50);
};
window.addEventListener('beforeunload', () => {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch { /* ignore */ }
});

let onLocalChange = () => {};
export const setLocalChangeHandler = (fn) => { onLocalChange = fn; };

// ---------- Læsning ----------

export const get = (col, id) => {
  const r = db[col]?.[id];
  return r && !r.deleted ? r : undefined;
};

export const all = (col) => Object.values(db[col] || {}).filter((r) => !r.deleted);

export const getMeta = () => meta;

// ---------- Skrivning ----------

const markDirty = (col, id) => {
  meta.outbox[`${col}|${id}`] = true;
};

export const put = (col, id, data) => {
  const prev = db[col][id];
  const rec = { ...(prev && !prev.deleted ? prev : {}), ...data, id, updatedAt: Date.now() };
  delete rec.deleted;
  db[col][id] = rec;
  markDirty(col, id);
  save();
  emit();
  onLocalChange();
  return rec;
};

export const remove = (col, id) => {
  if (!db[col][id]) return;
  db[col][id] = { id, updatedAt: Date.now(), deleted: true };
  markDirty(col, id);
  save();
  emit();
  onLocalChange();
};

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const setMeta = (patch) => {
  meta = { ...meta, ...patch };
  save();
  emit();
};

// ---------- Synk-hjælpere (bruges af sync.js) ----------

export const takeOutbox = () => {
  const keys = Object.keys(meta.outbox);
  const changes = keys.map((k) => {
    const [col, id] = k.split('|');
    const r = db[col]?.[id];
    if (!r) return null;
    const { updatedAt, deleted, ...data } = r;
    return { col, id, updatedAt, deleted: !!deleted, data: deleted ? null : data };
  }).filter(Boolean);
  return { keys, changes };
};

export const ackOutbox = (keys, sentChanges) => {
  // Fjern kun de nøgler, som ikke er ændret igen, mens vi ventede på svar
  const sentAt = Object.fromEntries(sentChanges.map((c) => [`${c.col}|${c.id}`, c.updatedAt]));
  for (const k of keys) {
    const [col, id] = k.split('|');
    if (db[col]?.[id]?.updatedAt === sentAt[k]) delete meta.outbox[k];
  }
};

export const applyRemote = (changes) => {
  let changed = false;
  for (const c of changes) {
    if (!db[c.col]) continue;
    const cur = db[c.col][c.id];
    if (cur && cur.updatedAt >= c.updatedAt) continue;
    db[c.col][c.id] = c.deleted
      ? { id: c.id, updatedAt: c.updatedAt, deleted: true }
      : { ...c.data, id: c.id, updatedAt: c.updatedAt };
    changed = true;
  }
  if (changed) emit();
  save();
};

// Markér alt lokalt som "skal sendes" (når man kobler en enhed til et rum)
export const markAllDirty = (exclude = []) => {
  for (const c of COLLECTIONS) {
    if (exclude.includes(c)) continue;
    for (const id of Object.keys(db[c])) markDirty(c, id);
  }
  save();
};

// ---------- Eksport / import / nulstil ----------

export const exportAll = () => JSON.stringify({ app: 'histamin-app', exportedAt: new Date().toISOString(), db }, null, 2);

export const importAll = (json) => {
  const parsed = JSON.parse(json);
  const incoming = parsed.db || parsed;
  const changes = [];
  for (const col of COLLECTIONS) {
    for (const [id, r] of Object.entries(incoming[col] || {})) {
      const { updatedAt, deleted, ...data } = r;
      changes.push({ col, id, updatedAt: updatedAt || Date.now(), deleted, data });
    }
  }
  applyRemote(changes);
  markAllDirty();
  onLocalChange();
  return changes.length;
};

export const resetAll = () => {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(META_KEY);
  location.reload();
};

// ---------- React ----------

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// Gen-render når noget i databasen ændrer sig
export const useDb = () => useSyncExternalStore(subscribe, () => version);

// Indstillinger (delt mellem enheder)
export const DEFAULT_SETTINGS = {
  startDate: null,
  days: 14,
  servings: 2,
  name: '',
  baselineDays: null,
  baselineIntensity: null,
  onboarded: false,
};

export const getSettings = () => ({ ...DEFAULT_SETTINGS, ...(get('settings', 'main') || {}) });
export const setSettings = (patch) => put('settings', 'main', { ...getSettings(), ...patch });
