const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Pantry First server is running smoothly.' });
});

// Dynamic recipe lookup route
app.get('/api/recipes', async (req, res) => {
  // 1. Extract ingredients from URL query params
  const { ingredients } = req.query;

  // 2. Input validation
  if (!ingredients) {
    return res.status(400).json({ error: 'Ingredients query parameter is required.' });
  }

  const apiKey = process.env.SPOONACULAR_API_KEY;

  try {
    const response = await axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
      params: {
        ingredients: ingredients,
        number: 6, // Increased to 6 recipes for a clean UI layout later
        apiKey: apiKey
      }
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error("API Error Details:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});