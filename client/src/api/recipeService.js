import apiClient from './apiClient';

export async function searchRecipes(ingredients) {
  const response = await apiClient.get('/recipes', {
    params: { ingredients },
  });

  return Array.isArray(response.data) ? response.data : [];
}

export async function getRecipeById(id, pantryIngredients = []) {
  const ingredients = Array.isArray(pantryIngredients)
    ? pantryIngredients.join(',')
    : pantryIngredients;
  const params = ingredients ? { ingredients } : undefined;
  const response = await apiClient.get(`/recipes/${encodeURIComponent(id)}`, { params });

  return response.data;
}
