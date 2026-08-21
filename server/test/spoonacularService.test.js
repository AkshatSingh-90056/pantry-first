const test = require('node:test');
const assert = require('node:assert/strict');
const { classifySpoonacularError } = require('../services/spoonacularService');

test('classifySpoonacularError maps timeout and network failures safely', () => {
  const timeout = classifySpoonacularError({ code: 'ECONNABORTED' });
  const network = classifySpoonacularError({ code: 'ENOTFOUND', request: {} });

  assert.deepEqual(
    { status: timeout.status, code: timeout.code, message: timeout.publicMessage },
    { status: 504, code: 'RECIPE_PROVIDER_TIMEOUT', message: 'Recipe information is taking too long to respond. Please try again.' },
  );
  assert.deepEqual(
    { status: network.status, code: network.code, message: network.publicMessage },
    { status: 503, code: 'RECIPE_PROVIDER_UNAVAILABLE', message: 'Recipe information is temporarily unavailable. Please try again.' },
  );
});

test('classifySpoonacularError handles provider HTTP failures without leaking provider data', () => {
  const cases = [
    [400, 502, 'RECIPE_PROVIDER_BAD_REQUEST'],
    [401, 503, 'RECIPE_PROVIDER_UNAVAILABLE'],
    [403, 503, 'RECIPE_PROVIDER_UNAVAILABLE'],
    [404, 404, 'RECIPE_NOT_FOUND'],
    [429, 429, 'RECIPE_PROVIDER_QUOTA'],
    [500, 503, 'RECIPE_PROVIDER_UNAVAILABLE'],
    [502, 503, 'RECIPE_PROVIDER_UNAVAILABLE'],
    [503, 503, 'RECIPE_PROVIDER_UNAVAILABLE'],
    [504, 503, 'RECIPE_PROVIDER_UNAVAILABLE'],
    [418, 502, 'RECIPE_PROVIDER_ERROR'],
  ];

  for (const [providerStatus, status, code] of cases) {
    const error = classifySpoonacularError({ response: { status: providerStatus, data: { apiKey: 'secret' } } });

    assert.equal(error.status, status);
    assert.equal(error.code, code);
    assert.equal(error.publicMessage.includes('secret'), false);
  }
});
