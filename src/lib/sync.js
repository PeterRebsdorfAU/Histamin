// Baggrundssynkronisering med serveren.

import { takeOutbox, ackOutbox, applyRemote, getMeta, setMeta, setLocalChangeHandler, markAllDirty } from './db.js';

let running = false;
let again = false;
let debounce = null;

export async function syncNow() {
  const { space } = getMeta();
  if (!space) return;
  if (running) { again = true; return; }
  running = true;
  try {
    const { keys, changes } = takeOutbox();
    const res = await fetch(`/api/sync/${encodeURIComponent(space)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ since: getMeta().cursor || 0, changes }),
    });
    if (!res.ok) throw new Error(`Server svarede ${res.status}`);
    const data = await res.json();
    ackOutbox(keys, changes);
    applyRemote(data.changes || []);
    setMeta({ cursor: data.cursor, lastSync: Date.now(), syncError: null });
  } catch (err) {
    setMeta({ syncError: navigator.onLine ? String(err.message || err) : 'Offline' });
  } finally {
    running = false;
    if (again) { again = false; syncNow(); }
  }
}

export function startSync() {
  setLocalChangeHandler(() => {
    clearTimeout(debounce);
    debounce = setTimeout(syncNow, 1200);
  });
  syncNow();
  setInterval(() => { if (document.visibilityState === 'visible') syncNow(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow(); });
  window.addEventListener('online', syncNow);
}

const WORDS = ['blaabaer', 'gulerod', 'squash', 'persille', 'havre', 'mango', 'dild', 'aeble', 'pastinak', 'basilikum', 'fennikel', 'melon', 'porre', 'ingefaer', 'kartoffel', 'timian'];

export function generateSpace() {
  const rnd = crypto.getRandomValues(new Uint32Array(3));
  const w = (n) => WORDS[n % WORDS.length];
  return `${w(rnd[0])}-${w(rnd[1] >> 8)}-${rnd[2].toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export const isValidSpace = (s) => /^[a-z0-9-]{12,64}$/.test(s || '');

// create=true: ny delingskode – alt lokalt sendes op.
// create=false: tilslut en eksisterende – partnerens indstillinger (startdato m.m.)
// bevares, men lokale dagbogsnoter, indkøb osv. flettes ind.
export function joinSpace(space, { create = false } = {}) {
  setMeta({ space, cursor: 0, syncError: null, outbox: {} });
  markAllDirty(create ? [] : ['settings']);
  return syncNow();
}

export function leaveSpace() {
  setMeta({ space: null, cursor: 0, outbox: {}, lastSync: null, syncError: null });
}
