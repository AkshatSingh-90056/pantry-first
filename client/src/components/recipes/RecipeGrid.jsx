import RecipeCard from './RecipeCard';

function RecipeGrid({ recipes, pantryIngredients }) {
  return (
    <div className="recipe-grid">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} pantryIngredients={pantryIngredients} />
      ))}
    </div>
  );
}

export default RecipeGrid;
