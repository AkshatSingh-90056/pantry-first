const test = require('node:test');
const assert = require('node:assert/strict');
const { mapRecipeDetail, mapRecipeSummaries } = require('../mappers/recipeMapper');

test('mapRecipeSummaries normalizes recipe cards and computes pantry match values', () => {
  const recipes = mapRecipeSummaries([
    {
      id: 12,
      title: 'Tomato Rice',
      image: 'https://images.example/tomato-rice.jpg',
      usedIngredients: [{ id: 1, name: 'tomato', amount: 2, unit: 'whole' }],
      missedIngredients: [{ id: 2, originalName: 'rice', amount: 1, unit: 'cup' }],
    },
  ]);

  assert.deepEqual(recipes[0], {
    id: 12,
    title: 'Tomato Rice',
    image: 'https://images.example/tomato-rice.jpg',
    imageType: null,
    usedIngredients: [{ id: 1, name: 'tomato', amount: 2, unit: 'whole', original: undefined }],
    missedIngredients: [{ id: 2, name: 'rice', amount: 1, unit: 'cup', original: undefined }],
    usedIngredientCount: 1,
    missedIngredientCount: 1,
    matchPercent: 50,
  });
});

test('mapRecipeDetail cleans provider data and maps recipe detail fields', () => {
  const detail = mapRecipeDetail({
    id: 99,
    title: '  <b>Tomato &amp; Rice</b> ',
    image: 'https://images.example/recipe.jpg',
    summary: '<p>A quick &quot;weeknight&quot; meal.</p>',
    servings: '4',
    preparationMinutes: 10,
    cookingMinutes: 20,
    readyInMinutes: 30,
    vegetarian: true,
    glutenFree: true,
    diets: ['Vegetarian'],
    cuisines: ['Italian', 'italian'],
    extendedIngredients: [
      { id: 1, name: 'Tomatoes', amount: '2', unit: 'cups', original: '2 cups tomatoes', meta: ['diced'] },
      { id: 2, name: 'Rice', amount: 1, unit: 'cup', original: '1 cup rice' },
    ],
    analyzedInstructions: [{
      steps: [{ step: 'Cook the tomatoes.', equipment: [{ name: 'Saucepan' }] }],
    }],
    nutrition: {
      nutrients: [
        { name: 'Calories', amount: '320' },
        { name: 'Protein', amount: 12 },
        { name: 'Carbohydrates', amount: 48 },
        { name: 'Fat', amount: 9 },
      ],
    },
  }, 'tomatoes, garlic');

  assert.equal(detail.title, 'Tomato & Rice');
  assert.equal(detail.summary, 'A quick "weeknight" meal.');
  assert.deepEqual(detail.diets, ['vegetarian', 'gluten-free']);
  assert.deepEqual(detail.cuisines, ['Italian']);
  assert.deepEqual(detail.ingredients[0], {
    ingredientId: 1,
    name: 'tomatoes',
    amount: 2,
    unit: 'cups',
    original: '2 cups tomatoes',
    note: 'diced',
  });
  assert.deepEqual(detail.steps, [{ number: 1, text: 'Cook the tomatoes.', equipment: ['saucepan'] }]);
  assert.deepEqual(detail.equipment, ['saucepan']);
  assert.deepEqual(detail.nutrition, {
    calories: 320,
    proteinGrams: 12,
    carbohydratesGrams: 48,
    fatGrams: 9,
  });
  assert.deepEqual(detail.pantryMatch, {
    usedIngredients: ['tomatoes'],
    missedIngredients: ['rice'],
    usedIngredientCount: 1,
    missedIngredientCount: 1,
    matchPercent: 50,
  });
});

test('mapRecipeDetail falls back to plain instructions and handles absent optional data', () => {
  const detail = mapRecipeDetail({ id: 7, title: 'Simple Soup', instructions: '<p>Heat and serve.</p>' });

  assert.deepEqual(detail.steps, [{ number: 1, text: 'Heat and serve.', equipment: [] }]);
  assert.equal(detail.nutrition, null);
  assert.equal(detail.pantryMatch, null);
  assert.deepEqual(detail.ingredients, []);
});
