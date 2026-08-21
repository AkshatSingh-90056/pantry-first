import { useEffect, useState } from 'react';
import './App.css';
import { getApiErrorMessage } from './api/apiClient';
import { searchRecipes } from './api/recipeService';
import StateMessage from './components/common/StateMessage';
import IngredientSearch from './components/search/IngredientSearch';
import RecipeGrid from './components/recipes/RecipeGrid';
import RecipeDetailsPage from './components/recipes/RecipeDetailsPage';

function getRecipeIdFromPath(pathname) {
  const match = pathname.match(/^\/recipes\/([^/]+)\/?$/);

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

const dietaryFilterValues = {
  vegetarian: 'vegetarian',
  vegan: 'vegan',
  glutenFree: 'gluten-free',
};

function App() {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearch, setLastSearch] = useState('');
  const [dietaryFilters, setDietaryFilters] = useState({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
  });
  const [recipeId, setRecipeId] = useState(() => getRecipeIdFromPath(window.location.pathname));
  const [locationSearch, setLocationSearch] = useState(() => window.location.search);

  useEffect(() => {
    const handlePopState = () => {
      setRecipeId(getRecipeIdFromPath(window.location.pathname));
      setLocationSearch(window.location.search);
    };
    window.addEventListener('popstate', handlePopState);

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateHome = (event) => {
    event?.preventDefault();

    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }

    setRecipeId(null);
    setLocationSearch('');
  };

  const handleSearch = async (event, submittedIngredients = ingredients) => {
    event.preventDefault();
    const trimmedIngredients = submittedIngredients.trim();

    if (!trimmedIngredients) {
      setError('Please add at least one ingredient to your pantry.');
      setRecipes([]);
      setHasSearched(false);
      return;
    }

    setIngredients(trimmedIngredients);
    setLastSearch(trimmedIngredients);
    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const selectedDietaryFilters = Object.entries(dietaryFilters)
        .filter(([, selected]) => selected)
        .map(([filter]) => dietaryFilterValues[filter]);
      const nextRecipes = await searchRecipes(trimmedIngredients, selectedDietaryFilters);
      setRecipes(nextRecipes);
    } catch (requestError) {
      console.error('Error fetching recipes:', requestError);
      setRecipes([]);
      setError(getApiErrorMessage(requestError, 'Failed to connect to the backend server.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Pantry First home" onClick={navigateHome}>
          <span className="brand__mark" aria-hidden="true">PF</span>
          <span>Pantry First</span>
        </a>
        <span className="header-note">Cook what you have</span>
      </header>

      {recipeId ? (
        <RecipeDetailsPage
          key={recipeId}
          recipeId={recipeId}
          locationSearch={locationSearch}
          onBack={navigateHome}
        />
      ) : (
      <main>
        <section className="hero-section">
          <p className="eyebrow">Less waste. More good meals.</p>
          <h1>Start with your pantry.</h1>
          <p className="hero-section__copy">Tell us what you have on hand and we&apos;ll find a recipe worth making tonight.</p>
          <IngredientSearch
            value={ingredients}
            onChange={setIngredients}
            onSubmit={handleSearch}
            isLoading={loading}
            dietaryFilters={dietaryFilters}
            onDietaryFilterChange={(filter, selected) => {
              setDietaryFilters((currentFilters) => ({ ...currentFilters, [filter]: selected }));
            }}
          />
        </section>

        <section className="results-section" aria-live="polite">
          {loading && (
            <StateMessage
              variant="loading"
              title="Looking through the pantry"
              description="Finding recipes that make the most of what you have."
            />
          )}
          {!loading && error && (
            <StateMessage
              variant="error"
              title="We couldn&apos;t find recipes"
              description={error}
              action={<button className="button button--secondary" type="button" onClick={(event) => handleSearch(event, lastSearch)}>Try again</button>}
            />
          )}
          {!loading && !error && hasSearched && recipes.length === 0 && (
            <StateMessage
              title="Nothing matched this pantry"
              description="Try adding a broader ingredient or two and search again."
            />
          )}
          {!loading && !error && recipes.length > 0 && (
            <>
              <div className="results-heading">
                <div>
                  <p className="eyebrow">Your next meal</p>
                  <h2>Recipes from what you have</h2>
                </div>
                <span>{recipes.length} ideas</span>
              </div>
              <RecipeGrid recipes={recipes} pantryIngredients={lastSearch} />
            </>
          )}
          {!loading && !error && !hasSearched && (
            <StateMessage
              title="Your pantry is the starting point"
              description="Add a few ingredients above to see recipes ranked by what you already have."
            />
          )}
        </section>
      </main>
      )}

      <footer className="app-footer">Pantry First · Make the most of what&apos;s already here.</footer>
    </div>
  );
}

export default App;
