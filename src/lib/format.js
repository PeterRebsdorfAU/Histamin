// Pæn visning af mængder i opskrifter (fx 0,5 stk → ½ stk, 1500 g → 1,5 kg)

const FRACTIONS = { 0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔' };

export function fmtQty(qty, unit) {
  if (!qty) return unit || '';
  let q = qty;
  let u = unit;
  if (u === 'g' && q >= 1000) { q /= 1000; u = 'kg'; }
  if (u === 'ml' && q >= 1000) { q /= 1000; u = 'l'; }
  if (u === 'dl' && q >= 10) { q /= 10; u = 'l'; }
  if (u === 'g' && q >= 100) q = Math.round(q / 10) * 10;
  const whole = Math.floor(q);
  const frac = Math.round((q - whole) * 100) / 100;
  let s;
  if (FRACTIONS[frac]) s = `${whole || ''}${FRACTIONS[frac]}`;
  else s = String(Math.round(q * 10) / 10).replace('.', ',');
  return `${s} ${u}`.trim();
}
