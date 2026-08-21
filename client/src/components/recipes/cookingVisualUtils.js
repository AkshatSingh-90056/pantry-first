function getIngredientText(ingredient) {
  if (typeof ingredient === 'string') {
    return ingredient.trim();
  }

  return [ingredient?.name, ingredient?.original].filter(Boolean).join(' ').trim();
}

function getIngredientLabel(ingredient) {
  if (typeof ingredient === 'string') {
    return ingredient.trim();
  }

  return ingredient?.original || ingredient?.name || '';
}

export function containsWholePhrase(text, phrase) {
  const normalizedText = text.toLowerCase();
  const normalizedPhrase = phrase.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return new RegExp(`(?:^|[^a-z])${normalizedPhrase}(?:$|[^a-z])`).test(normalizedText);
}

function isVisualIngredientMatch(ingredientText, stepText, definition) {
  const blockedTerms = definition.blockedTerms || [];

  if (blockedTerms.some((term) => containsWholePhrase(ingredientText, term))) {
    return false;
  }

  return definition.terms.some((term) => (
    containsWholePhrase(ingredientText, term) && containsWholePhrase(stepText, term)
  ));
}

function getStepVisualIngredients(ingredients, stepText, registry) {
  const normalizedStep = stepText.toLowerCase();
  const selectedTypes = new Set();

  return ingredients.reduce((visualIngredients, ingredient) => {
    const ingredientText = getIngredientText(ingredient);
    const match = Object.entries(registry).find(([type, definition]) => (
      !selectedTypes.has(type)
      && isVisualIngredientMatch(ingredientText, normalizedStep, definition)
    ));

    if (match) {
      const [type, definition] = match;
      selectedTypes.add(type);
      visualIngredients.push({
        type,
        label: getIngredientLabel(ingredient),
        asset: definition.asset,
        position: definition.position,
      });
    }

    return visualIngredients;
  }, []);
}

export function getStepActionFlags(stepText) {
  const normalizedStep = stepText.toLowerCase();
  const isServing = /\b(serve|plate|garnish)\b/.test(normalizedStep);
  const isStirring = /\b(stir|mix|toss|whisk|fold|scrape)\b/.test(normalizedStep);
  const isSimmering = /\b(simmer|boil|steam)\b/.test(normalizedStep);
  const isHeating = /\b(cook|heat|fry|saut|saute|sauté|reduce|opaque|pink)\b/.test(normalizedStep);
  const introducesIngredients = /\b(add|pour|place|drop|introduce|combine|stir in|mix in|fold in)\b/.test(normalizedStep)
    || /\bput\b(?!\s+(?:aside|away))/.test(normalizedStep);
  const hasNonPanContainer = /\b(processor|bowls?|mat|plate|counter)\b/.test(normalizedStep);
  const isPrep = /\b(chop|dice|slice|peel|season|marinate|wash|clean|mash)\b/.test(normalizedStep);
  const referencesPreparedMixture = /\b(mixture|above|prepared|set aside|from the bowl)\b/.test(normalizedStep);
  const hasCookingContext = /\b(pan|skillet|saucepan|pot|wok|dutch oven)\b/.test(normalizedStep)
    || isStirring
    || isSimmering
    || isHeating;
  const shouldAddToPan = !hasNonPanContainer && hasCookingContext && (
    introducesIngredients || isStirring || isSimmering || isHeating
  );
  const action = isServing
    ? 'serve'
    : isStirring
      ? 'stir'
      : isSimmering
        ? 'simmer'
        : isHeating
          ? 'cook'
          : introducesIngredients
            ? 'add'
            : 'none';

  return {
    action,
    introducesIngredients,
    shouldAddToPan,
    hasNonPanContainer,
    isPrep,
    referencesPreparedMixture,
    heatLevel: isSimmering ? 3 : isHeating ? 2 : introducesIngredients && /\b(pan|skillet|saucepan|pot|wok)\b/.test(normalizedStep) ? 1 : 0,
    steam: isSimmering || /\b(steam|steaming)\b/.test(normalizedStep),
  };
}

export function getCookingVisualState(steps, ingredients, currentStepIndex, registry) {
  const boundedStepIndex = Math.min(Math.max(currentStepIndex, 0), steps.length - 1);
  const panIngredients = new Map();
  const preparedIngredients = new Map();
  let currentAddedIngredients = [];
  let currentAction = { action: 'none', heatLevel: 0, steam: false };

  for (let index = 0; index <= boundedStepIndex; index += 1) {
    const step = steps[index];
    const stepIngredients = getStepVisualIngredients(ingredients, step.text, registry);
    const action = getStepActionFlags(step.text);

    if (action.isPrep || action.hasNonPanContainer) {
      stepIngredients.forEach((ingredient) => preparedIngredients.set(ingredient.type, ingredient));
    }

    if (action.shouldAddToPan) {
      const addedIngredients = new Map();
      if (action.referencesPreparedMixture) {
        preparedIngredients.forEach((ingredient, type) => addedIngredients.set(type, ingredient));
      }
      stepIngredients.forEach((ingredient) => addedIngredients.set(ingredient.type, ingredient));
      addedIngredients.forEach((ingredient, type) => panIngredients.set(type, ingredient));
      if (index === boundedStepIndex) {
        currentAddedIngredients = [...addedIngredients.values()];
      }
    }

    if (index === boundedStepIndex) {
      currentAction = action;
    }
  }

  return {
    panIngredients: [...panIngredients.values()],
    ingredientsEntering: currentAction.action !== 'serve'
      && currentAction.shouldAddToPan
      && currentAction.introducesIngredients
      ? currentAddedIngredients
      : [],
    ...currentAction,
  };
}
