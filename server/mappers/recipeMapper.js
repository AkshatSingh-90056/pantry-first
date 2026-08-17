function mapIngredient(ingredient) {
  return {
    id: ingredient?.id,
    name: ingredient?.name || ingredient?.originalName || ingredient?.original || 'Unknown ingredient',
    amount: ingredient?.amount,
    unit: ingredient?.unit,
    original: ingredient?.original,
  };
}

function cleanText(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const withoutTags = value.replace(/<[^>]*>/g, ' ');
  const decoded = withoutTags
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  const normalized = decoded.replace(/\s+/g, ' ').trim();

  return normalized || null;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeName(value) {
  return cleanText(value)
    ?.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || null;
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const cleaned = cleanText(value);
    const key = cleaned?.toLowerCase();

    if (cleaned && key && !seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    }
  }

  return result;
}

function uniqueNormalizedNames(values) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const normalized = normalizeName(value);

    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

function uniqueTags(values) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    const tag = cleanText(value)
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (tag && !seen.has(tag)) {
      seen.add(tag);
      result.push(tag);
    }
  }

  return result;
}

function mapDetailIngredient(ingredient) {
  const metadata = Array.isArray(ingredient?.meta) ? ingredient.meta : [];

  return {
    ingredientId: nullableNumber(ingredient?.id),
    name: normalizeName(ingredient?.name || ingredient?.originalName || ingredient?.original),
    amount: nullableNumber(ingredient?.amount),
    unit: cleanText(ingredient?.unit),
    original: cleanText(ingredient?.original),
    note: uniqueStrings(metadata).join(', ') || null,
  };
}

function mapStepEquipment(equipment) {
  return uniqueNormalizedNames(
    Array.isArray(equipment)
      ? equipment.map((item) => item?.name || item?.localized)
      : []
  );
}

function mapSteps(instructions, rawInstructions) {
  const steps = [];

  if (Array.isArray(instructions)) {
    for (const section of instructions) {
      if (!Array.isArray(section?.steps)) {
        continue;
      }

      for (const step of section.steps) {
        const text = cleanText(step?.step);

        if (text) {
          steps.push({
            number: steps.length + 1,
            text,
            equipment: mapStepEquipment(step?.equipment),
          });
        }
      }
    }
  }

  if (steps.length) {
    return steps;
  }

  const fallbackText = cleanText(rawInstructions);
  return fallbackText
    ? [{ number: 1, text: fallbackText, equipment: [] }]
    : [];
}

function mapNutrition(nutrition) {
  const nutrients = Array.isArray(nutrition?.nutrients) ? nutrition.nutrients : [];
  const values = {
    calories: null,
    proteinGrams: null,
    carbohydratesGrams: null,
    fatGrams: null,
  };
  const nutrientNames = {
    calories: 'calories',
    protein: 'proteinGrams',
    carbohydrates: 'carbohydratesGrams',
    fat: 'fatGrams',
  };

  for (const nutrient of nutrients) {
    const key = cleanText(nutrient?.name)?.toLowerCase();

    if (key && nutrientNames[key]) {
      values[nutrientNames[key]] = nullableNumber(nutrient.amount);
    }
  }

  return Object.values(values).some((value) => value !== null) ? values : null;
}

function mapDiets(recipe) {
  const diets = Array.isArray(recipe?.diets) ? recipe.diets : [];
  const booleanDiets = [
    ['vegetarian', recipe?.vegetarian],
    ['vegan', recipe?.vegan],
    ['gluten-free', recipe?.glutenFree],
    ['dairy-free', recipe?.dairyFree],
  ];

  return uniqueTags([
    ...diets,
    ...booleanDiets.filter(([, enabled]) => enabled === true).map(([name]) => name),
  ]);
}

function ingredientMatches(recipeName, pantryName) {
  return recipeName === pantryName || recipeName.includes(pantryName) || pantryName.includes(recipeName);
}

function mapPantryMatch(ingredients, pantryContext) {
  const pantryNames = uniqueNormalizedNames(pantryContext.split(','));
  const usedIngredients = [];
  const missedIngredients = [];

  for (const ingredient of ingredients) {
    if (!ingredient.name) {
      continue;
    }

    const owned = pantryNames.some((pantryName) => ingredientMatches(ingredient.name, pantryName));
    (owned ? usedIngredients : missedIngredients).push(ingredient.name);
  }

  return {
    usedIngredients,
    missedIngredients,
    usedIngredientCount: usedIngredients.length,
    missedIngredientCount: missedIngredients.length,
    matchPercent: usedIngredients.length + missedIngredients.length
      ? Math.round((usedIngredients.length / (usedIngredients.length + missedIngredients.length)) * 100)
      : 0,
  };
}

function mapRecipeSummary(recipe) {
  const usedIngredients = Array.isArray(recipe?.usedIngredients)
    ? recipe.usedIngredients.map(mapIngredient)
    : [];
  const missedIngredients = Array.isArray(recipe?.missedIngredients)
    ? recipe.missedIngredients.map(mapIngredient)
    : [];
  const totalIngredients = usedIngredients.length + missedIngredients.length;

  return {
    id: recipe?.id,
    title: recipe?.title || 'Untitled recipe',
    image: recipe?.image || null,
    imageType: recipe?.imageType || null,
    usedIngredients,
    missedIngredients,
    usedIngredientCount: usedIngredients.length,
    missedIngredientCount: missedIngredients.length,
    matchPercent: totalIngredients ? Math.round((usedIngredients.length / totalIngredients) * 100) : 0,
  };
}

function mapRecipeSummaries(recipes) {
  return Array.isArray(recipes) ? recipes.map(mapRecipeSummary) : [];
}

function mapRecipeDetail(recipe, pantryContext) {
  const ingredients = Array.isArray(recipe?.extendedIngredients)
    ? recipe.extendedIngredients.map(mapDetailIngredient)
    : [];
  const steps = mapSteps(recipe?.analyzedInstructions, recipe?.instructions);
  const equipment = uniqueNormalizedNames(steps.flatMap((step) => step.equipment));

  return {
    id: nullableNumber(recipe?.id),
    title: cleanText(recipe?.title),
    image: cleanText(recipe?.image),
    summary: cleanText(recipe?.summary),
    servings: nullableNumber(recipe?.servings),
    prepMinutes: nullableNumber(recipe?.preparationMinutes),
    cookMinutes: nullableNumber(recipe?.cookingMinutes),
    readyInMinutes: nullableNumber(recipe?.readyInMinutes),
    diets: mapDiets(recipe),
    cuisines: uniqueStrings(Array.isArray(recipe?.cuisines) ? recipe.cuisines : []),
    ingredients,
    steps,
    equipment,
    nutrition: mapNutrition(recipe?.nutrition),
    pantryMatch: typeof pantryContext === 'string' ? mapPantryMatch(ingredients, pantryContext) : null,
  };
}

module.exports = { mapRecipeSummaries, mapRecipeSummary, mapRecipeDetail };
