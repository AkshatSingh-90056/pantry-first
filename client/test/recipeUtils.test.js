import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMatchPercent,
  formatMinutes,
  normalizeIngredientList,
  parseIngredientInput,
} from '../src/utils/recipeUtils.js';

test('parseIngredientInput trims entries and removes empty values', () => {
  assert.deepEqual(parseIngredientInput(' chicken, rice ,, garlic '), ['chicken', 'rice', 'garlic']);
  assert.deepEqual(parseIngredientInput(''), []);
});

test('normalizeIngredientList accepts strings and Spoonacular ingredient shapes', () => {
  assert.deepEqual(normalizeIngredientList([
    ' tomato ',
    { name: 'rice' },
    { originalName: 'garlic cloves' },
    { original: 'salt to taste' },
    {},
  ]), ['tomato', 'rice', 'garlic cloves', 'salt to taste', 'Unknown ingredient']);
});

test('calculateMatchPercent uses a mapped value or derives one from ingredients', () => {
  assert.equal(calculateMatchPercent({ matchPercent: 66.6 }), 67);
  assert.equal(calculateMatchPercent({ usedIngredients: [{ name: 'rice' }], missedIngredients: [{ name: 'tomato' }, { name: 'garlic' }] }), 33);
  assert.equal(calculateMatchPercent({}), 0);
});

test('formatMinutes supplies a useful fallback', () => {
  assert.equal(formatMinutes(25), '25 min');
  assert.equal(formatMinutes(null), 'Time not listed');
});
