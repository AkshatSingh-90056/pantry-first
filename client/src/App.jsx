import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecipes = async (e) => {
    e.preventDefault();
    
    if (!ingredients.trim()) {
      setError('Please enter at least one ingredient.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get('http://127.0.0.1:5000/api/recipes', {
        params: { ingredients }
      });
      setRecipes(response.data);
    } catch (err) {
      console.error('Error fetching recipes:', err);
      setError(err.response?.data?.error || 'Failed to connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Pantry First Recipe Generator</h1>
      <p>Find recipes using ingredients you already have in your kitchen.</p>

      <form onSubmit={fetchRecipes} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="e.g., chicken, rice, garlic"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          style={{ flex: 1, padding: '10px', fontSize: '16px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
          Search Recipes
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <p>Searching your pantry...</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {recipes.map((recipe) => (
          <div 
            key={recipe.id} 
            style={{ 
              border: '1px solid #ccc', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between'
            }}
          >
            <div>
              <img 
                src={recipe.image || 'https://via.placeholder.com/312x231?text=No+Image+Available'} 
                alt={recipe.title} 
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://via.placeholder.com/312x231?text=No+Image+Available';
                }}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }} 
              />
              <div style={{ padding: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{recipe.title}</h3>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}>
                  <strong>Used Ingredients:</strong> {recipe.usedIngredients.map(i => i.name).join(', ')}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px', color: '#777' }}>
                  <strong>Missing Ingredients:</strong> {recipe.missedIngredients.map(i => i.name).join(', ')}
                </p>
              </div>
            </div>

            <div style={{ padding: '0 15px 15px 15px' }}>
              <a 
                href={`https://www.google.com/search?q=${encodeURIComponent(recipe.title + ' recipe')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '10px',
                  backgroundColor: '#007bff',
                  color: '#fff',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  textAlign: 'center'
                }}
              >
                View Full Recipe ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;