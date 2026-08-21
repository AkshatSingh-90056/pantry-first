import ingredientAtlas from '../../assets/ingredient-atlas.webp';

const atlasPositions = {
  topLeft: '0% 0%',
  topCenterLeft: '33.333% 0%',
  topCenterRight: '66.666% 0%',
  topRight: '100% 0%',
  middleLeft: '0% 33.333%',
  middleCenterLeft: '33.333% 33.333%',
  middleCenterRight: '66.666% 33.333%',
  middleRight: '100% 33.333%',
  bottomLeft: '0% 66.666%',
  bottomCenterLeft: '33.333% 66.666%',
  bottomCenterRight: '66.666% 66.666%',
  bottomRight: '100% 66.666%',
  lowerLeft: '0% 100%',
  lowerCenterLeft: '33.333% 100%',
  lowerCenterRight: '66.666% 100%',
  lowerRight: '100% 100%',
};

export const ingredientVisualRegistry = {
  tomato: { asset: ingredientAtlas, position: atlasPositions.topLeft, terms: ['tomato', 'tomatoes', 'passata'] },
  garlic: { asset: ingredientAtlas, position: atlasPositions.topCenterLeft, terms: ['garlic'] },
  onion: { asset: ingredientAtlas, position: atlasPositions.topCenterRight, terms: ['onion', 'onions', 'shallot', 'shallots'] },
  chicken: {
    asset: ingredientAtlas,
    position: atlasPositions.topRight,
    terms: ['chicken'],
    blockedTerms: ['broth', 'stock', 'bouillon'],
  },
  shrimp: { asset: ingredientAtlas, position: atlasPositions.middleLeft, terms: ['shrimp', 'prawn', 'prawns'] },
  egg: { asset: ingredientAtlas, position: atlasPositions.middleCenterLeft, terms: ['egg', 'eggs'] },
  rice: { asset: ingredientAtlas, position: atlasPositions.middleCenterRight, terms: ['rice'] },
  pasta: { asset: ingredientAtlas, position: atlasPositions.middleRight, terms: ['pasta', 'spaghetti', 'noodle', 'noodles'] },
  potato: { asset: ingredientAtlas, position: atlasPositions.bottomLeft, terms: ['potato', 'potatoes'] },
  lemon: { asset: ingredientAtlas, position: atlasPositions.bottomCenterLeft, terms: ['lemon', 'lime'] },
  carrot: { asset: ingredientAtlas, position: atlasPositions.bottomCenterRight, terms: ['carrot', 'carrots'] },
  mushroom: { asset: ingredientAtlas, position: atlasPositions.bottomRight, terms: ['mushroom', 'mushrooms'] },
  bellPepper: { asset: ingredientAtlas, position: atlasPositions.lowerLeft, terms: ['bell pepper', 'bell peppers', 'capsicum'] },
  broccoli: { asset: ingredientAtlas, position: atlasPositions.lowerCenterLeft, terms: ['broccoli'] },
  herbs: { asset: ingredientAtlas, position: atlasPositions.lowerCenterRight, terms: ['thyme', 'parsley', 'basil', 'cilantro', 'dill', 'herb', 'herbs'] },
  oil: {
    asset: ingredientAtlas,
    position: atlasPositions.lowerRight,
    terms: ['oil', 'butter'],
    blockedTerms: ['olive', 'coconut', 'sesame'],
  },
};
