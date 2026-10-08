// Tjekker at alle opskrifter kun peger på eksisterende fødevarer,
// og viser opskrifter der indeholder fødevarer vurderet 2 eller højere.
import { FOODS, FOOD_BY_ID } from '../src/data/foods.js';
import { RECIPES } from '../src/data/recipes.js';
import { IDEAS } from '../src/data/guide.js';

let errors = 0;
const ids = new Set();
for (const f of FOODS) {
  if (ids.has(f.id)) { console.error(`Dublet-id: ${f.id}`); errors++; }
  ids.add(f.id);
}
for (const r of RECIPES) {
  for (const i of r.ingredients) {
    if (!FOOD_BY_ID[i.f]) { console.error(`${r.id}: ukendt fødevare "${i.f}"`); errors++; continue; }
    if (!i.opt && FOOD_BY_ID[i.f].r >= 2) console.warn(`${r.id}: indeholder ${i.f} (vurdering ${FOOD_BY_ID[i.f].r})`);
  }
}
for (const sec of Object.values(IDEAS)) {
  for (const it of sec.items) for (const f of it.foods) if (!FOOD_BY_ID[f]) { console.error(`Idé "${it.title}": ukendt fødevare "${f}"`); errors++; }
}
console.log(`${FOODS.length} fødevarer, ${RECIPES.length} opskrifter, ${errors} fejl`);
process.exit(errors ? 1 : 0);
