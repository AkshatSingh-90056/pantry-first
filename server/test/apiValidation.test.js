const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');
const { RecipeProviderError } = require('../services/spoonacularService');

async function withServer(testApp, callback) {
  const server = testApp.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    return await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

function createProviderFailureApp(error) {
  return app.createApp({
    findRecipesByIngredients: async () => { throw error; },
    getRecipeInformation: async () => { throw error; },
  });
}

test('health endpoint responds successfully', async () => {
  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { message: 'Pantry First server is running smoothly.' });
  });
});

test('recipe search rejects a missing or blank ingredients query with the normalized contract', async () => {
  await withServer(app, async (baseUrl) => {
    for (const path of ['/api/recipes', '/api/recipes?ingredients=%20%20']) {
      const response = await fetch(`${baseUrl}${path}`);

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), {
        error: {
          code: 'INVALID_INGREDIENTS',
          message: 'Ingredients query parameter is required.',
        },
      });
    }
  });
});

test('recipe detail rejects invalid recipe ids before provider access', async () => {
  let providerCalled = false;
  const testApp = app.createApp({
    findRecipesByIngredients: async () => [],
    getRecipeInformation: async () => {
      providerCalled = true;
      return {};
    },
  });

  await withServer(testApp, async (baseUrl) => {
    for (const id of ['0', '-1', 'abc', '1.5']) {
      const response = await fetch(`${baseUrl}/api/recipes/${id}`);

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), {
        error: {
          code: 'INVALID_RECIPE_ID',
          message: 'Recipe ID must be a positive integer.',
        },
      });
    }
  });

  assert.equal(providerCalled, false);
});

test('a valid recipe id reaches the provider and preserves successful detail responses', async () => {
  let requestedId;
  const testApp = app.createApp({
    findRecipesByIngredients: async () => [],
    getRecipeInformation: async (id) => {
      requestedId = id;
      return {
        id,
        title: 'Tomato Rice',
        extendedIngredients: [],
        analyzedInstructions: [],
      };
    },
  });

  await withServer(testApp, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/recipes/1`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      id: 1,
      title: 'Tomato Rice',
      image: null,
      summary: null,
      servings: null,
      prepMinutes: null,
      cookMinutes: null,
      readyInMinutes: null,
      diets: [],
      cuisines: [],
      ingredients: [],
      steps: [],
      equipment: [],
      nutrition: null,
      pantryMatch: null,
    });
  });

  assert.equal(requestedId, 1);
});

test('provider errors use the normalized, user-safe API error contract', async () => {
  const cases = [
    [new RecipeProviderError(504, 'RECIPE_PROVIDER_TIMEOUT', 'Recipe information is taking too long to respond. Please try again.'), 504, 'RECIPE_PROVIDER_TIMEOUT'],
    [new RecipeProviderError(429, 'RECIPE_PROVIDER_QUOTA', 'Recipe requests are temporarily limited. Please try again shortly.'), 429, 'RECIPE_PROVIDER_QUOTA'],
    [new RecipeProviderError(503, 'RECIPE_PROVIDER_UNAVAILABLE', 'Recipe information is temporarily unavailable. Please try again.'), 503, 'RECIPE_PROVIDER_UNAVAILABLE'],
    [new RecipeProviderError(404, 'RECIPE_NOT_FOUND', 'Recipe could not be found.'), 404, 'RECIPE_NOT_FOUND'],
    [new RecipeProviderError(502, 'RECIPE_PROVIDER_ERROR', 'Recipe information could not be retrieved. Please try again.'), 502, 'RECIPE_PROVIDER_ERROR'],
  ];

  for (const [providerError, status, code] of cases) {
    await withServer(createProviderFailureApp(providerError), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/recipes/1`);
      const body = await response.json();

      assert.equal(response.status, status);
      assert.equal(body.error.code, code);
      assert.equal(body.error.message, providerError.publicMessage);
      assert.deepEqual(Object.keys(body.error).sort(), ['code', 'message']);
    });
  }
});
