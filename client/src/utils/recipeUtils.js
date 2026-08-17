export function getIngredientName(ingredient) {
  if (typeof ingredient === 'string') {
    return ingredient;
  }

  return ingredient?.name || ingredient?.originalName || ingredient?.original || 'Unknown ingredient';
}

export function normalizeIngredientList(ingredients = []) {
  return ingredients
    .map(getIngredientName)
    .map((ingredient) => ingredient.trim())
    .filter(Boolean);
}

export function parseIngredientInput(value = '') {
  return value
    .split(',')
    .map((ingredient) => ingredient.trim())
    .filter(Boolean);
}

export function calculateMatchPercent(recipe) {
  if (typeof recipe?.matchPercent === 'number') {
    return Math.round(recipe.matchPercent);
  }

  const usedCount = recipe?.usedIngredients?.length || 0;
  const missingCount = recipe?.missedIngredients?.length || 0;
  const totalCount = usedCount + missingCount;

  return totalCount ? Math.round((usedCount / totalCount) * 100) : 0;
}

export function formatMinutes(minutes) {
  if (!minutes) {
    return 'Time not listed';
  }

  return `${minutes} min`;
}
