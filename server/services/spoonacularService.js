const axios = require('axios');

const SPOONACULAR_URL = 'https://api.spoonacular.com/recipes/findByIngredients';
const SPOONACULAR_COMPLEX_SEARCH_URL = 'https://api.spoonacular.com/recipes/complexSearch';
const SPOONACULAR_INFORMATION_URL = 'https://api.spoonacular.com/recipes';
const SUPPORTED_DIETARY_FILTERS = new Set(['vegetarian', 'vegan', 'gluten-free']);

function getApiKey() {
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    const error = new Error('SPOONACULAR_API_KEY is not configured.');
    error.code = 'SPOONACULAR_NOT_CONFIGURED';
    throw error;
  }

  return apiKey;
}

async function findRecipesByIngredients(ingredients, dietaryFilters = []) {
  const apiKey = getApiKey();
  const selectedDietaryFilters = Array.isArray(dietaryFilters)
    ? dietaryFilters.filter((filter) => SUPPORTED_DIETARY_FILTERS.has(filter))
    : [];

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
    error.isSpoonacularError = true;
    throw error;
  }
}

module.exports = { findRecipesByIngredients, getRecipeInformation };
