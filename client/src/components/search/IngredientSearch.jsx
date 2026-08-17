import { useState } from 'react';
import { parseIngredientInput } from '../../utils/recipeUtils';

const suggestions = ['chicken', 'rice', 'garlic', 'tomatoes'];

function IngredientSearch({ value, onChange, onSubmit, isLoading = false }) {
  const [draft, setDraft] = useState('');
  const ingredients = parseIngredientInput(value);

  const updateIngredients = (nextIngredients) => {
    onChange(nextIngredients.join(', '));
  };

  const addIngredient = (ingredient) => {
    const nextIngredient = ingredient.trim();

    if (!nextIngredient || ingredients.some((item) => item.toLowerCase() === nextIngredient.toLowerCase())) {
      return;
    }

    updateIngredients([...ingredients, nextIngredient]);
    setDraft('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const submittedIngredients = draft.trim() ? [...ingredients, draft.trim()] : ingredients;

    if (draft.trim()) {
      updateIngredients(submittedIngredients);
      setDraft('');
    }

    onSubmit(event, submittedIngredients.join(', '));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addIngredient(draft);
    }

    if (event.key === 'Backspace' && !draft && ingredients.length) {
      updateIngredients(ingredients.slice(0, -1));
    }
  };

  return (
    <div className="ingredient-search">
      <form className="ingredient-search__form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="ingredient-input">Ingredients</label>
        <div className="ingredient-search__control">
          <span className="ingredient-search__mark" aria-hidden="true">+</span>
          <div className="ingredient-search__tokens">
            {ingredients.map((ingredient) => (
              <span className="ingredient-token" key={ingredient}>
                {ingredient}
                <button
                  type="button"
                  aria-label={`Remove ${ingredient}`}
                  onClick={() => updateIngredients(ingredients.filter((item) => item !== ingredient))}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              id="ingredient-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={ingredients.length ? 'Add another ingredient' : 'Try chicken, rice, garlic...'}
              autoComplete="off"
            />
          </div>
        </div>
        <button className="button button--primary ingredient-search__submit" type="submit" disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Find recipes'}
        </button>
      </form>
      <div className="ingredient-search__suggestions" aria-label="Ingredient suggestions">
        <span>Popular:</span>
        {suggestions.map((suggestion) => (
          <button type="button" key={suggestion} onClick={() => addIngredient(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export default IngredientSearch;
