import { FOOD_BY_ID, SHOP_SECTIONS } from '../data/foods.js';
import { get, getSettings } from './db.js';
import { getRecipe } from './recipes.js';
import { weekdayShort } from './dates.js';

const UNIT_ALIAS = { kvist: 'kviste', fede: 'fed', stk: 'stk', bundter: 'bundt' };
const normUnit = (u) => UNIT_ALIAS[(u || '').trim()] || (u || '').trim();

// Saml ingredienser fra madplanen for de givne datoer
export function buildShopping(dates) {
  const settings = getSettings();
  const items = new Map();

  for (const date of dates) {
    const entry = get('plan', date);
    const recipe = getRecipe(entry?.recipeId);
    if (!recipe) continue;
    const scale = (entry.servings || settings.servings || 2) / (recipe.servings || 2);

    for (const ing of recipe.ingredients || []) {
      if (ing.opt) continue;
      const food = ing.f ? FOOD_BY_ID[ing.f] : null;
      const unit = normUnit(ing.u);
      const baseName = food ? food.name : (ing.n || '').trim();
      if (!baseName) continue;
      const key = `${food ? food.id : `x:${baseName.toLowerCase()}`}|${unit}`;
      let it = items.get(key);
      if (!it) {
        it = {
          key, foodId: food?.id, name: baseName, unit, qty: 0,
          section: food?.shop || 'andet', staple: !!food?.staple, r: food?.r, uses: [], variants: new Set(),
        };
        items.set(key, it);
      }
      it.qty += (Number(ing.q) || 0) * scale;
      if (ing.n && food && ing.n.toLowerCase() !== food.name.toLowerCase()) it.variants.add(ing.n);
      it.uses.push(`${weekdayShort(date)}: ${recipe.title}`);
    }
  }

  return [...items.values()].map((it) => ({ ...it, variants: [...it.variants] }));
}

export function groupBySection(items) {
  return SHOP_SECTIONS
    .map((s) => ({ ...s, items: items.filter((i) => i.section === s.id).sort((a, b) => a.name.localeCompare(b.name, 'da')) }))
    .filter((s) => s.items.length);
}

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

export function shoppingText(sections, manual) {
  const lines = ['Indkøbsliste 🛒', ''];
  for (const s of sections) {
    const open = s.items.filter((i) => !i.checked);
    if (!open.length) continue;
    lines.push(`${s.label}:`);
    for (const i of open) lines.push(`☐ ${i.name}${i.qty ? ` – ${fmtQty(i.qty, i.unit)}` : ''}`);
    lines.push('');
  }
  const m = manual.filter((x) => !x.checked);
  if (m.length) {
    lines.push('Andet:');
    for (const x of m) lines.push(`☐ ${x.name}`);
  }
  return lines.join('\n').trim();
}
