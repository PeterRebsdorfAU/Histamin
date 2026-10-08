import { RECIPES, RECIPE_BY_ID } from '../data/recipes.js';
import { FOOD_BY_ID } from '../data/foods.js';
import { all, get } from './db.js';

export const allRecipes = () => [
  ...RECIPES,
  ...all('customRecipes').map((r) => ({ ...r, custom: true })).sort((a, b) => a.title.localeCompare(b.title, 'da')),
];

export const getRecipe = (id) => {
  if (!id) return undefined;
  if (RECIPE_BY_ID[id]) return RECIPE_BY_ID[id];
  const c = get('customRecipes', id);
  return c ? { ...c, custom: true } : undefined;
};

// Personlig vurdering af en fødevare (hvis hun har markeret "reagerer")
export const foodStatus = (foodId) => get('foodNotes', foodId)?.status;

// Værste vurdering blandt de ikke-valgfrie ingredienser
export const recipeRating = (recipe) => {
  let worst = 0;
  for (const ing of recipe.ingredients || []) {
    if (ing.opt || !ing.f) continue;
    const food = FOOD_BY_ID[ing.f];
    if (!food) continue;
    let r = food.r;
    if (foodStatus(ing.f) === 'reaction') r = 3;
    if (r > worst) worst = r;
  }
  return worst;
};

export const recipeWarnings = (recipe) =>
  (recipe.ingredients || [])
    .filter((ing) => ing.f && FOOD_BY_ID[ing.f])
    .map((ing) => ({ ing, food: FOOD_BY_ID[ing.f], reaction: foodStatus(ing.f) === 'reaction' }))
    .filter((x) => x.food.r >= 2 || x.reaction);

export const recipesUsingFood = (foodId) => allRecipes().filter((r) => r.ingredients?.some((i) => i.f === foodId));

export const recipeOpinion = (id) => get('recipeNotes', id);

// Fryservenlige / optøning – hvad skal tages op i dag til i morgen?
export const thawText = (recipe) => {
  if (!recipe) return null;
  if (recipe.thaw) return recipe.thaw;
  const frozen = (recipe.ingredients || []).find((i) => !i.opt && FOOD_BY_ID[i.f]?.shop === 'frost' && FOOD_BY_ID[i.f]?.cat === 'fisk');
  return frozen ? FOOD_BY_ID[frozen.f].name.toLowerCase() : null;
};
