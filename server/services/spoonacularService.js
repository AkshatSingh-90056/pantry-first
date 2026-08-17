const axios = require('axios');

const SPOONACULAR_URL = 'https://api.spoonacular.com/recipes/findByIngredients';
const SPOONACULAR_INFORMATION_URL = 'https://api.spoonacular.com/recipes';

function getApiKey() {
  const apiKey = process.env.SPOONACULAR_API_KEY;

  if (!apiKey) {
    const error = new Error('SPOONACULAR_API_KEY is not configured.');
    error.code = 'SPOONACULAR_NOT_CONFIGURED';
    throw error;
  }

  return apiKey;
}

async function findRecipesByIngredients(ingredients) {
  const apiKey = getApiKey();

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
