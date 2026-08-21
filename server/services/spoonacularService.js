const axios = require('axios');

const SPOONACULAR_URL = 'https://api.spoonacular.com/recipes/findByIngredients';
const SPOONACULAR_COMPLEX_SEARCH_URL = 'https://api.spoonacular.com/recipes/complexSearch';
const SPOONACULAR_INFORMATION_URL = 'https://api.spoonacular.com/recipes';
const SUPPORTED_DIETARY_FILTERS = new Set(['vegetarian', 'vegan', 'gluten-free']);

class RecipeProviderError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'RecipeProviderError';
    this.status = status;
    this.code = code;
    this.publicMessage = message;
  }
}

function classifySpoonacularError(error) {
  if (error instanceof RecipeProviderError) {
    return error;
  }

  const upstreamStatus = error?.response?.status;

  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return new RecipeProviderError(504, 'RECIPE_PROVIDER_TIMEOUT', 'Recipe information is taking too long to respond. Please try again.');
  }

  if (!upstreamStatus && (error?.request || error?.code)) {
    return new RecipeProviderError(503, 'RECIPE_PROVIDER_UNAVAILABLE', 'Recipe information is temporarily unavailable. Please try again.');
  }

  if (upstreamStatus === 400) {
    return new RecipeProviderError(502, 'RECIPE_PROVIDER_BAD_REQUEST', 'Recipe information could not be retrieved. Please try again.');
  }

  if (upstreamStatus === 401 || upstreamStatus === 403) {
    return new RecipeProviderError(503, 'RECIPE_PROVIDER_UNAVAILABLE', 'Recipe information is temporarily unavailable. Please try again.');
  }

  if (upstreamStatus === 404) {
    return new RecipeProviderError(404, 'RECIPE_NOT_FOUND', 'Recipe could not be found.');
  }

  if (upstreamStatus === 429) {
    return new RecipeProviderError(429, 'RECIPE_PROVIDER_QUOTA', 'Recipe requests are temporarily limited. Please try again shortly.');
  }

  if (upstreamStatus >= 500 && upstreamStatus <= 599) {
    return new RecipeProviderError(503, 'RECIPE_PROVIDER_UNAVAILABLE', 'Recipe information is temporarily unavailable. Please try again.');
  }

  return new RecipeProviderError(502, 'RECIPE_PROVIDER_ERROR', 'Recipe information could not be retrieved. Please try again.');
}

function getApiKey() {
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    throw new RecipeProviderError(503, 'RECIPE_PROVIDER_UNAVAILABLE', 'Recipe information is temporarily unavailable. Please try again.');
  }

  return apiKey;
}

async function findRecipesByIngredients(ingredients, dietaryFilters = []) {
  const apiKey = getApiKey();
  const selectedDietaryFilters = Array.isArray(dietaryFilters)
    ? dietaryFilters.filter((filter) => SUPPORTED_DIETARY_FILTERS.has(filter))
    : [];

  try {
    if (selectedDietaryFilters.length) {
      const response = await axios.get(SPOONACULAR_COMPLEX_SEARCH_URL, {
        params: {
          includeIngredients: ingredients,
          diet: selectedDietaryFilters.join(','),
          fillIngredients: true,
          number: 6,
          apiKey,
        },
      });

      return Array.isArray(response.data?.results) ? response.data.results : [];
    }

    const response = await axios.get(SPOONACULAR_URL, {
      params: {
        ingredients,
        number: 6,
        apiKey,
      },
    });

    return response.data;
  } catch (error) {
    throw classifySpoonacularError(error);
  }
}

async function getRecipeInformation(id) {
  const apiKey = getApiKey();

  try {
    const response = await axios.get(`${SPOONACULAR_INFORMATION_URL}/${id}/information`, {
      params: {
        includeNutrition: true,
        apiKey,
      },
    });

    return response.data;
  } catch (error) {
    throw classifySpoonacularError(error);
  }
}

module.exports = {
  RecipeProviderError,
  classifySpoonacularError,
  findRecipesByIngredients,
  getRecipeInformation,
};
