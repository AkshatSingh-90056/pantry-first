import test from 'node:test';
import assert from 'node:assert/strict';
import { formatScaledIngredient, isValidServingCount } from '../src/utils/servingUtils.js';

test('serving-size validation only accepts positive finite numbers', () => {
  assert.equal(isValidServingCount(4), true);
  assert.equal(isValidServingCount(0), false);
  assert.equal(isValidServingCount(Infinity), false);
  assert.equal(isValidServingCount('4'), false);
});

test('formatScaledIngredient scales quantities and rounds display values', () => {
  assert.equal(
    formatScaledIngredient({ name: 'flour', amount: 0.333, unit: 'cup' }, 6, 4),
    '0.5 cup flour',
  );
  assert.equal(
    formatScaledIngredient({ name: 'eggs', amount: 2, unit: '' }, 2, 4),
    '1 eggs',
  );
});

test('formatScaledIngredient preserves original text when quantity cannot be scaled', () => {
  assert.equal(
    formatScaledIngredient({ name: 'salt', amount: null, original: 'salt to taste' }, 4, 2),
    'salt to taste',
  );
  assert.equal(
    formatScaledIngredient({ name: 'water', amount: 0, unit: 'ml' }, 4, 2),
    '0 ml water',
  );
});
