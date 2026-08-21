import test from 'node:test';
import assert from 'node:assert/strict';
import {
  containsWholePhrase,
  getCookingVisualState,
  getStepActionFlags,
} from '../src/components/recipes/cookingVisualUtils.js';

const registry = {
  tomato: { asset: 'tomato.png', position: '0% 0%', terms: ['tomato', 'tomatoes'] },
  chicken: { asset: 'chicken.png', position: '50% 0%', terms: ['chicken'], blockedTerms: ['broth'] },
};

test('containsWholePhrase does not match partial ingredient names', () => {
  assert.equal(containsWholePhrase('Add tomato to the pan.', 'tomato'), true);
  assert.equal(containsWholePhrase('Add tomatoes to the pan.', 'tomato'), false);
});

test('getStepActionFlags distinguishes preparation, cooking, and serving actions', () => {
  assert.equal(getStepActionFlags('Chop the tomatoes in a bowl.').isPrep, true);
  const cook = getStepActionFlags('Add tomatoes to the pan and simmer.');
  assert.equal(cook.action, 'simmer');
  assert.equal(cook.shouldAddToPan, true);
  assert.equal(cook.heatLevel, 3);
  assert.equal(getStepActionFlags('Serve with herbs.').action, 'serve');
});

test('getCookingVisualState carries prepared ingredients into a later pan step', () => {
  const state = getCookingVisualState([
    { text: 'Chop tomatoes in a bowl.' },
    { text: 'Add the prepared mixture to the pan and simmer.' },
  ], [{ name: 'tomatoes' }, { name: 'chicken broth' }], 1, registry);

  assert.deepEqual(state.panIngredients.map((ingredient) => ingredient.type), ['tomato']);
  assert.deepEqual(state.ingredientsEntering.map((ingredient) => ingredient.type), ['tomato']);
  assert.equal(state.action, 'simmer');
});
