import { calculateMatchPercent } from '../../utils/recipeUtils';

function PantryMatch({ recipe, percent }) {
  const matchPercent = percent ?? calculateMatchPercent(recipe);
  const radius = 25;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (matchPercent / 100) * circumference;

  return (
    <div className="pantry-match" title={`${matchPercent}% pantry match`}>
      <svg viewBox="0 0 64 64" role="img" aria-label={`${matchPercent}% pantry match`}>
        <circle className="pantry-match__track" cx="32" cy="32" r={radius} />
        <circle
          className="pantry-match__value"
          cx="32"
          cy="32"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <strong>{matchPercent}%</strong>
      <span>match</span>
    </div>
  );
}

export default PantryMatch;
