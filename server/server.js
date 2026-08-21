const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { findRecipesByIngredients, getRecipeInformation } = require('./services/spoonacularService');
const { mapRecipeSummaries, mapRecipeDetail } = require('./mappers/recipeMapper');

const app = express();
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

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Pantry First server is running smoothly.' });
});

app.get('/api/recipes', async (req, res) => {
  const ingredients = typeof req.query.ingredients === 'string' ? req.query.ingredients.trim() : '';
  const dietaryFilters = parseDietaryFilters(req.query.diet);

  if (!ingredients) {
    return res.status(400).json({ error: 'Ingredients query parameter is required.' });
  }

  try {
    const recipes = await findRecipesByIngredients(ingredients, dietaryFilters);
    return res.status(200).json(mapRecipeSummaries(recipes));
  } catch (error) {
    console.error('Spoonacular API error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

app.get('/api/recipes/:id', async (req, res) => {
  if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) {
    return res.status(400).json({
      error: {
        code: 'INVALID_RECIPE_ID',
        message: 'Recipe ID must be a positive integer.',
      },
    });
  }

  const recipeId = Number(req.params.id);
  const hasPantryContext = Object.prototype.hasOwnProperty.call(req.query, 'ingredients');
  const pantryContext = typeof req.query.ingredients === 'string' ? req.query.ingredients : '';

  let recipe;

  try {
    recipe = await getRecipeInformation(recipeId);
  } catch (error) {
    if (!error.isSpoonacularError && error.code !== 'SPOONACULAR_NOT_CONFIGURED') {
      console.error('Unexpected recipe detail error.');
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    }

    const upstreamStatus = error.response?.status;

    if (upstreamStatus === 404) {
      return res.status(404).json({
        error: {
          code: 'RECIPE_NOT_FOUND',
          message: 'Recipe could not be found.',
        },
      });
    }

    if (upstreamStatus === 402 || upstreamStatus === 429) {
      return res.status(503).json({
        error: {
          code: 'RECIPE_PROVIDER_QUOTA',
          message: 'Recipe information is temporarily unavailable.',
        },
      });
    }

    if (error.code === 'SPOONACULAR_NOT_CONFIGURED') {
      console.error('Recipe provider is not configured.');
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred.',
        },
      });
    }

    console.error('Recipe detail provider request failed:', {
      status: upstreamStatus || null,
      code: error.code || null,
    });
    return res.status(502).json({
      error: {
        code: 'RECIPE_PROVIDER_UNAVAILABLE',
        message: 'Recipe information is temporarily unavailable.',
      },
    });
  }

  if (!isValidRecipePayload(recipe, recipeId)) {
    console.error('Recipe detail provider returned an invalid payload.');
    return res.status(502).json({
      error: {
        code: 'RECIPE_PROVIDER_UNAVAILABLE',
        message: 'Recipe information is temporarily unavailable.',
      },
    });
  }

  try {
    return res.status(200).json(mapRecipeDetail(recipe, hasPantryContext ? pantryContext : undefined));
  } catch (error) {
    console.error('Recipe detail mapping failed:', error.message);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
