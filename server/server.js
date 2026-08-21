const express = require('express');
const cors = require('cors');
require('dotenv').config();
const spoonacularService = require('./services/spoonacularService');
const { mapRecipeSummaries, mapRecipeDetail } = require('./mappers/recipeMapper');

const PORT = process.env.PORT || 5000;
const SUPPORTED_DIETARY_FILTERS = new Set(['vegetarian', 'vegan', 'gluten-free']);

function parseDietaryFilters(value) {
  if (typeof value !== 'string') {
    return [];
  }

  return [...new Set(
    value
      .split(',')
      .map((filter) => filter.trim().toLowerCase())
      .filter((filter) => SUPPORTED_DIETARY_FILTERS.has(filter))
  )];
}

function isValidRecipePayload(recipe, requestedId) {
  return Boolean(
    recipe
    && typeof recipe === 'object'
    && !Array.isArray(recipe)
    && Number.isSafeInteger(Number(recipe.id))
    && Number(recipe.id) === requestedId
    && typeof recipe.title === 'string'
    && recipe.title.trim()
  );
}

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

function sendProviderError(res, error) {
  if (error instanceof spoonacularService.RecipeProviderError) {
    console.error('Recipe provider request failed:', { status: error.status, code: error.code });
    return sendError(res, error.status, error.code, error.publicMessage);
  }

  console.error('Unexpected recipe request failure.');
  return sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
}

function createApp(recipeService = spoonacularService) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Pantry First server is running smoothly.' });
});

  app.get('/api/recipes', async (req, res) => {
  const ingredients = typeof req.query.ingredients === 'string' ? req.query.ingredients.trim() : '';
  const dietaryFilters = parseDietaryFilters(req.query.diet);

  if (!ingredients) {
    return sendError(res, 400, 'INVALID_INGREDIENTS', 'Ingredients query parameter is required.');
  }

  try {
    const recipes = await recipeService.findRecipesByIngredients(ingredients, dietaryFilters);
    return res.status(200).json(mapRecipeSummaries(recipes));
  } catch (error) {
    return sendProviderError(res, error);
  }
});

  app.get('/api/recipes/:id', async (req, res) => {
  if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) {
    return sendError(res, 400, 'INVALID_RECIPE_ID', 'Recipe ID must be a positive integer.');
  }

  const recipeId = Number(req.params.id);
  const hasPantryContext = Object.prototype.hasOwnProperty.call(req.query, 'ingredients');
  const pantryContext = typeof req.query.ingredients === 'string' ? req.query.ingredients : '';

  let recipe;

  try {
    recipe = await recipeService.getRecipeInformation(recipeId);
  } catch (error) {
    return sendProviderError(res, error);
  }

  if (!isValidRecipePayload(recipe, recipeId)) {
    console.error('Recipe detail provider returned an invalid payload.');
    return sendError(res, 502, 'RECIPE_PROVIDER_INVALID_RESPONSE', 'Recipe information could not be retrieved. Please try again.');
  }

  try {
    return res.status(200).json(mapRecipeDetail(recipe, hasPantryContext ? pantryContext : undefined));
  } catch (error) {
    console.error('Recipe detail mapping failed:', error.message);
    return sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
  }
});

  return app;
}

const app = createApp();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
