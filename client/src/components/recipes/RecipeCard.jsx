import { calculateMatchPercent, formatMinutes, normalizeIngredientList } from '../../utils/recipeUtils';
import PantryMatch from './PantryMatch';

const fallbackImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420"><rect width="640" height="420" fill="#e7eee5"/><text x="320" y="210" fill="#356b4b" font-family="Arial, sans-serif" font-size="28" text-anchor="middle">No image available</text></svg>'
)}`;

function RecipeCard({ recipe }) {
  const usedIngredients = normalizeIngredientList(recipe.usedIngredients);
  const missedIngredients = normalizeIngredientList(recipe.missedIngredients);
  const matchPercent = calculateMatchPercent(recipe);

  return (
    <article className="recipe-card">
      <div className="recipe-card__image-wrap">
        <img
          className="recipe-card__image"
          src={recipe.image || fallbackImage}
          alt={recipe.title || 'Recipe'}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = fallbackImage;
          }}
        />
        <PantryMatch recipe={recipe} percent={matchPercent} />
      </div>
      <div className="recipe-card__body">
        <h3>{recipe.title || 'Untitled recipe'}</h3>
        <p className="recipe-card__time">{formatMinutes(recipe.readyInMinutes)}{recipe.servings ? ` · ${recipe.servings} servings` : ''}</p>
        <div className="recipe-card__ingredients">
          <div>
            <span className="ingredient-label ingredient-label--have">You have</span>
            <p>{usedIngredients.length ? usedIngredients.join(', ') : 'No matching ingredients listed'}</p>
          </div>
          <div>
            <span className="ingredient-label ingredient-label--need">Still needed</span>
            <p>{missedIngredients.length ? missedIngredients.join(', ') : 'Nothing listed'}</p>
          </div>
        </div>
      </div>
      <div className="recipe-card__footer">
        <a
          className="button button--secondary"
          href={`https://www.google.com/search?q=${encodeURIComponent(`${recipe.title || 'recipe'} recipe`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View recipe <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

export default RecipeCard;
