import { useState } from 'react';
import { ingredientVisualRegistry } from './ingredientVisualRegistry';

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

function containsWholePhrase(text, phrase) {
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

function getStepVisualIngredients(ingredients, stepText) {
  const normalizedStep = stepText.toLowerCase();
  const selectedTypes = new Set();

  return ingredients.reduce((visualIngredients, ingredient) => {
    const ingredientText = getIngredientText(ingredient);
    const match = Object.entries(ingredientVisualRegistry).find(([type, definition]) => (
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

function getStepActionFlags(stepText) {
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

function getCookingVisualState(steps, ingredients, currentStepIndex) {
  const boundedStepIndex = Math.min(Math.max(currentStepIndex, 0), steps.length - 1);
  const panIngredients = new Map();
  const preparedIngredients = new Map();
  let currentAddedIngredients = [];
  let currentAction = { action: 'none', heatLevel: 0, steam: false };

  for (let index = 0; index <= boundedStepIndex; index += 1) {
    const step = steps[index];
    const stepIngredients = getStepVisualIngredients(ingredients, step.text);
    const action = getStepActionFlags(step.text);

    if (action.isPrep || action.hasNonPanContainer) {
      stepIngredients.forEach((ingredient) => {
        preparedIngredients.set(ingredient.type, ingredient);
      });
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

function getSafeCookingVisualState(steps, ingredients, currentStepIndex) {
  try {
    return getCookingVisualState(steps, ingredients, currentStepIndex);
  } catch {
    return {
      panIngredients: [],
      ingredientsEntering: [],
      action: 'none',
      heatLevel: 0,
      steam: false,
    };
  }
}

function CookingPan({ visualState = {} }) {
  const {
    panIngredients = [],
    ingredientsEntering = [],
    action = 'none',
    heatLevel = 0,
    steam = false,
  } = visualState;
  const enteringTypes = new Set(ingredientsEntering.map((ingredient) => ingredient.type));
  const stageClassName = [
    'cooking-mode__pan-stage',
    `cooking-mode__pan-stage--${action}`,
    heatLevel > 0 && `cooking-mode__pan-stage--heat-${heatLevel}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={stageClassName} aria-hidden="true">
      <span className="cooking-mode__pan-light cooking-mode__pan-light--warm" />
      <span className="cooking-mode__pan-light cooking-mode__pan-light--cool" />
      <div className="cooking-mode__pan-shadow" />
      <div className="cooking-mode__pan">
        <span className="cooking-mode__pan-handle" />
        <span className="cooking-mode__pan-rim">
          <span className="cooking-mode__pan-surface">
            {panIngredients.map((ingredient, index) => (
              <span
                className={`cooking-mode__pan-ingredient cooking-mode__pan-ingredient--position-${Math.min(index + 1, 6)}${enteringTypes.has(ingredient.type) ? ' cooking-mode__pan-ingredient--entering' : ''}`}
                key={ingredient.type}
                style={{ backgroundImage: `url(${ingredient.asset})`, backgroundPosition: ingredient.position }}
              />
            ))}
          </span>
        </span>
      </div>

      {heatLevel > 0 && <span className="cooking-mode__pan-heat" />}
      {heatLevel >= 2 && <span className="cooking-mode__pan-bubbles" />}
      {steam && (
        <div className="cooking-mode__pan-steam">
          <span />
          <span />
          <span />
        </div>
      )}
    </div>
  );
}

function CookingMode({ steps, ingredients = [], onExit }) {
  const usableSteps = Array.isArray(steps) ? steps : [];
  const usableIngredientData = Array.isArray(ingredients) ? ingredients : [];
  const usableIngredients = usableIngredientData
    .map(getIngredientLabel)
    .filter(Boolean);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  if (!usableSteps.length) {
    return null;
  }

  const visualState = getSafeCookingVisualState(usableSteps, usableIngredientData, currentStepIndex);

  if (isComplete) {
    return (
      <div className="cooking-mode">
        <div className="cooking-mode__inner">
          <div className="cooking-mode__topbar">
            <button className="cooking-mode__back" type="button" onClick={onExit}>
              <span aria-hidden="true">←</span> Back to Recipe
            </button>
            <span className="cooking-mode__brand"><span aria-hidden="true" /> Digital Kitchen</span>
          </div>
          <div className="cooking-mode__complete-layout">
            <CookingPan visualState={{ ...visualState, action: 'serve', ingredientsEntering: [], steam: false }} />
            <section className="cooking-mode__complete" aria-labelledby="cooking-complete-heading">
              <p className="cooking-mode__kicker">Service complete</p>
              <h1 id="cooking-complete-heading">Cooking Complete</h1>
              <p>You finished all {usableSteps.length} steps.</p>
              <button className="button button--primary cooking-mode__complete-button" type="button" onClick={onExit}>
                Back to Recipe
              </button>
            </section>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = usableSteps[currentStepIndex];
  const equipment = Array.isArray(currentStep.equipment)
    ? currentStep.equipment.filter((item) => typeof item === 'string' && item.trim())
    : [];
  const stepNumber = currentStepIndex + 1;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === usableSteps.length - 1;
  const progressPercent = (stepNumber / usableSteps.length) * 100;

  return (
    <div className="cooking-mode">
      <div className="cooking-mode__inner">
        <div className="cooking-mode__topbar">
          <button className="cooking-mode__back" type="button" onClick={onExit}>
            <span aria-hidden="true">←</span> Back to Recipe
          </button>
          <span className="cooking-mode__brand"><span aria-hidden="true" /> Digital Kitchen</span>
        </div>

        <section className="cooking-mode__content" aria-labelledby="cooking-step-heading">
          <div className="cooking-mode__workbench">
            <CookingPan visualState={visualState} />

            <div className="cooking-mode__instruction">
              <div className="cooking-mode__heading-row">
                <div>
                  <p className="cooking-mode__kicker">Cooking mode</p>
                  <p className="cooking-mode__step-count">Step {stepNumber} of {usableSteps.length}</p>
                </div>
                <span className="cooking-mode__step-number" aria-hidden="true">{String(stepNumber).padStart(2, '0')}</span>
              </div>

              <div
                className="cooking-mode__progress-track"
                role="progressbar"
                aria-label={`Cooking progress: step ${stepNumber} of ${usableSteps.length}`}
                aria-valuemin="1"
                aria-valuemax={usableSteps.length}
                aria-valuenow={stepNumber}
              >
                <div className="cooking-mode__progress-value" style={{ width: `${progressPercent}%` }} />
              </div>

              <h1 id="cooking-step-heading" aria-live="polite">{currentStep.text}</h1>

              <div className="cooking-mode__support">
                {usableIngredients.length > 0 && (
                  <div className="cooking-mode__equipment cooking-mode__ingredients">
                    <h2>Ingredients</h2>
                    <ul>
                      {usableIngredients.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}

                {equipment.length > 0 && (
                  <div className="cooking-mode__equipment">
                    <h2>Equipment</h2>
                    <ul>
                      {equipment.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="cooking-mode__controls">
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => setCurrentStepIndex((index) => Math.max(0, index - 1))}
                  disabled={isFirstStep}
                >
                  Previous
                </button>
                <span aria-hidden="true">{stepNumber} / {usableSteps.length}</span>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => {
                    if (isLastStep) {
                      setIsComplete(true);
                      return;
                    }

                    setCurrentStepIndex((index) => Math.min(usableSteps.length - 1, index + 1));
                  }}
                >
                  {isLastStep ? 'Finish Cooking' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CookingMode;
