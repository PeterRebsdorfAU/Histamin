// Datoer håndteres som lokale 'YYYY-MM-DD'-strenge.

const pad = (n) => String(n).padStart(2, '0');

export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const today = () => toKey(new Date());

export const addDays = (k, n) => {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return toKey(d);
};

export const diffDays = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000);

export const range = (start, count) => Array.from({ length: count }, (_, i) => addDays(start, i));

const WEEKDAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
const MONTHS = ['jan.', 'feb.', 'mar.', 'apr.', 'maj', 'jun.', 'jul.', 'aug.', 'sep.', 'okt.', 'nov.', 'dec.'];

export const weekday = (k) => WEEKDAYS[fromKey(k).getDay()];
export const weekdayShort = (k) => weekday(k).slice(0, 3);

export const fmt = (k, { weekday: wd = true } = {}) => {
  const d = fromKey(k);
  const s = `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
  return wd ? `${WEEKDAYS[d.getDay()]} ${s}` : s;
};

export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export const relDay = (k) => {
  const d = diffDays(today(), k);
  if (d === 0) return 'I dag';
  if (d === 1) return 'I morgen';
  if (d === -1) return 'I går';
  return cap(fmt(k));
};

export const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
