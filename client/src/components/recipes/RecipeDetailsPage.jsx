import { useEffect, useState } from 'react';
import { getApiErrorMessage } from '../../api/apiClient';
import { getRecipeById } from '../../api/recipeService';
import PantryMatch from './PantryMatch';
import CookingMode from './CookingMode';
import StateMessage from '../common/StateMessage';
import { parseIngredientInput } from '../../utils/recipeUtils';
import { formatScaledIngredient, isValidServingCount } from '../../utils/servingUtils';

function formatTag(tag) {
  return tag
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function RecipeDetailsPage({ recipeId, locationSearch = window.location.search, onBack }) {
  const [requestState, setRequestState] = useState({
    recipeId: null,
    status: 'loading',
    recipe: null,
    error: null,
  });
  const [failedImageId, setFailedImageId] = useState(null);
  const [isCooking, setIsCooking] = useState(false);
  const [desiredServings, setDesiredServings] = useState(null);

  useEffect(() => {
    let active = true;

    const searchParams = new URLSearchParams(locationSearch);
    const pantryIngredients = parseIngredientInput(searchParams.get('ingredients') || '');

    getRecipeById(recipeId, pantryIngredients)
      .then((nextRecipe) => {
        if (active) {
          setDesiredServings(isValidServingCount(nextRecipe.servings) ? nextRecipe.servings : null);
          setRequestState({ recipeId, status: 'success', recipe: nextRecipe, error: null });
        }
      })
      .catch((requestError) => {
        if (active) {
          setRequestState({ recipeId, status: 'error', recipe: null, error: requestError });
        }
      })

    return () => {
      active = false;
    };
  }, [recipeId, locationSearch]);

  const currentState = requestState.recipeId === recipeId
    ? requestState
    : { status: 'loading', recipe: null, error: null };
  const { recipe, error } = currentState;

  if (currentState.status === 'loading') {
    return (
      <main className="recipe-detail-page">
        <StateMessage
          variant="loading"
          title="Loading recipe"
          description="Bringing the full recipe together."
        />
      </main>
    );
  }

  if (error || !recipe) {
    const isNotFound = error?.response?.status === 404;

    return (
      <main className="recipe-detail-page">
        <StateMessage
          variant="error"
          title={isNotFound ? 'Recipe not found' : 'Unable to load this recipe right now'}
          description={getApiErrorMessage(error, 'Please return to your recipe search and try again.')}
          action={<button className="button button--secondary" type="button" onClick={onBack}>Back to recipes</button>}
        />
      </main>
    );
  }

  const timing = [
    ['Prep', recipe.prepMinutes, 'min'],
    ['Cook', recipe.cookMinutes, 'min'],
    ['Total', recipe.readyInMinutes, 'min'],
  ].filter(([, value]) => value !== null && value !== undefined);
  const nutritionRows = [
    ['Calories', recipe.nutrition?.calories, 'kcal'],
    ['Protein', recipe.nutrition?.proteinGrams, 'g'],
    ['Carbohydrates', recipe.nutrition?.carbohydratesGrams, 'g'],
    ['Fat', recipe.nutrition?.fatGrams, 'g'],
  ].filter(([, value]) => value !== null && value !== undefined);
  const usableSteps = Array.isArray(recipe.steps)
    ? recipe.steps.filter((step) => typeof step?.text === 'string' && step.text.trim())
    : [];
  const originalServings = isValidServingCount(recipe.servings) ? recipe.servings : null;
  const displayedServings = originalServings ? desiredServings ?? originalServings : null;

  if (isCooking) {
    return (
      <main className="recipe-detail-page">
        <CookingMode
          steps={usableSteps}
          ingredients={recipe.ingredients}
          onExit={() => setIsCooking(false)}
        />
      </main>
    );
  }

  return (
    <main className="recipe-detail-page">
      <div className="recipe-detail-page__inner">
        <button className="recipe-detail-page__back" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span> Back to recipes
        </button>

        <div className="recipe-detail-hero">
          <div className="recipe-detail-hero__image-wrap">
            {recipe.image && failedImageId !== recipeId ? (
              <img
                className="recipe-detail-hero__image"
                src={recipe.image}
                alt={`${recipe.title || 'Recipe'} recipe`}
                onError={() => setFailedImageId(recipeId)}
              />
            ) : (
              <div className="recipe-detail-hero__image-placeholder">Image unavailable</div>
            )}
          </div>

          <div className="recipe-detail-hero__content">
            <div className="recipe-detail-tags">
              {recipe.diets.map((diet) => <span key={diet}>{formatTag(diet)}</span>)}
              {recipe.cuisines.map((cuisine) => <span key={cuisine}>{cuisine}</span>)}
            </div>
            <h1>{recipe.title}</h1>
            {recipe.summary && <p className="recipe-detail-summary">{recipe.summary}</p>}

            {timing.length > 0 && (
              <dl className="recipe-detail-timing">
                {timing.map(([label, value, unit]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}{unit ? ` ${unit}` : ''}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="recipe-detail-serving-control" aria-label="Serving size">
              <span className="recipe-detail-serving-control__label">Servings</span>
              {displayedServings ? (
                <div className="recipe-detail-serving-control__actions">
                  <button
                    className="recipe-detail-serving-control__button"
                    type="button"
                    aria-label="Decrease servings"
                    onClick={() => setDesiredServings(Math.max(1, displayedServings - 1))}
                    disabled={displayedServings <= 1}
                  >
                    −
                  </button>
                  <span className="recipe-detail-serving-control__value" aria-live="polite">{displayedServings}</span>
                  <button
                    className="recipe-detail-serving-control__button"
                    type="button"
                    aria-label="Increase servings"
                    onClick={() => setDesiredServings(displayedServings + 1)}
                  >
                    +
                  </button>
                </div>
              ) : (
                <span className="recipe-detail-serving-control__unavailable">Servings unavailable</span>
              )}
            </div>

            {usableSteps.length > 0 && (
              <button className="button button--primary recipe-detail-start" type="button" onClick={() => setIsCooking(true)}>
                Start Cooking <span aria-hidden="true">→</span>
              </button>
            )}

            {recipe.pantryMatch && (
              <div className="recipe-detail-match">
                <PantryMatch recipe={recipe.pantryMatch} />
                <div>
                  <strong>{recipe.pantryMatch.matchPercent}% of ingredients matched</strong>
                  <p>{recipe.pantryMatch.usedIngredientCount} on hand · {recipe.pantryMatch.missedIngredientCount} still needed</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="recipe-detail-content">
          <div className="recipe-detail-main">
            <section aria-labelledby="recipe-steps-heading">
              <p className="eyebrow">Method</p>
              <h2 id="recipe-steps-heading">Instructions</h2>
              {usableSteps.length > 0 ? (
                <ol className="recipe-detail-steps">
                  {usableSteps.map((step, index) => (
                    <li key={`${step.number}-${index}`}>
                      <span>{index + 1}</span>
                      <p>{step.text}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="recipe-detail-muted">Instructions are unavailable for this recipe.</p>
              )}
            </section>

            {recipe.equipment.length > 0 && (
              <section aria-labelledby="recipe-equipment-heading">
                <p className="eyebrow">Before you start</p>
                <h2 id="recipe-equipment-heading">Equipment</h2>
                <ul className="recipe-detail-list">
                  {recipe.equipment.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>
            )}

            <section aria-labelledby="recipe-nutrition-heading">
              <p className="eyebrow">Per serving</p>
              <h2 id="recipe-nutrition-heading">Nutrition</h2>
              {nutritionRows.length > 0 ? (
                <dl className="recipe-detail-nutrition">
                  {nutritionRows.map(([label, value, unit]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value} <span>{unit}</span></dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="recipe-detail-muted">Nutrition information is unavailable.</p>
              )}
            </section>
          </div>

          <aside className="recipe-detail-ingredients" aria-labelledby="recipe-ingredients-heading">
            <p className="eyebrow">What you&apos;ll need</p>
            <h2 id="recipe-ingredients-heading">Ingredients</h2>
            {recipe.ingredients.length > 0 ? (
              <ul className="recipe-detail-list">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={`${ingredient.name || ingredient.original}-${index}`}>
                    {formatScaledIngredient(ingredient, displayedServings, originalServings)}
                    {ingredient.note && ingredient.amount !== null && (
                      <span className="recipe-detail-note"> · {ingredient.note}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="recipe-detail-muted">Ingredients are unavailable.</p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

export default RecipeDetailsPage;
