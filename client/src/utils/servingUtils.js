export function isValidServingCount(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function formatAmount(value) {
  return String(Math.round((value + Number.EPSILON) * 100) / 100);
}

export function formatScaledIngredient(ingredient, desiredServings, originalServings) {
  const hasNumericAmount = typeof ingredient.amount === 'number' && Number.isFinite(ingredient.amount);
  const canDisplayNumericAmount = hasNumericAmount && ingredient.amount >= 0;
  const canScale = hasNumericAmount
    && ingredient.amount > 0
    && isValidServingCount(originalServings)
    && isValidServingCount(desiredServings);
  const displayAmount = canScale
    ? ingredient.amount * (desiredServings / originalServings)
    : canDisplayNumericAmount
      ? ingredient.amount
      : null;

  if (displayAmount === null || !Number.isFinite(displayAmount)) {
    return ingredient.original || ingredient.name || 'Ingredient unavailable';
  }

  const amount = `${formatAmount(displayAmount)}${ingredient.unit ? ` ${ingredient.unit}` : ''}`;
  const name = ingredient.name || 'Ingredient unavailable';

  return `${amount} ${name}`;
}
