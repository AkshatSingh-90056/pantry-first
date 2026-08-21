const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');

async function withServer(callback) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    return await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test('health endpoint responds successfully', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { message: 'Pantry First server is running smoothly.' });
  });
});

test('recipe search rejects a missing or blank ingredients query', async () => {
  await withServer(async (baseUrl) => {
    for (const path of ['/api/recipes', '/api/recipes?ingredients=%20%20']) {
      const response = await fetch(`${baseUrl}${path}`);

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: 'Ingredients query parameter is required.' });
    }
  });
});

test('recipe detail rejects invalid recipe ids before provider access', async () => {
  await withServer(async (baseUrl) => {
    for (const id of ['0', '-4', 'abc', '1.5']) {
      const response = await fetch(`${baseUrl}/api/recipes/${id}`);
      const body = await response.json();

      assert.equal(response.status, 400);
      assert.deepEqual(body, {
        error: {
          code: 'INVALID_RECIPE_ID',
          message: 'Recipe ID must be a positive integer.',
        },
      });
    }
  });
});
