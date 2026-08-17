import { useState } from 'react';

function CookingMode({ steps, onExit }) {
  const usableSteps = Array.isArray(steps) ? steps : [];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  if (!usableSteps.length) {
    return null;
  }

  if (isComplete) {
    return (
      <div className="cooking-mode">
        <div className="cooking-mode__inner">
          <button className="cooking-mode__back" type="button" onClick={onExit}>
            <span aria-hidden="true">←</span> Back to recipe
          </button>
          <section className="cooking-mode__complete" aria-labelledby="cooking-complete-heading">
            <p className="eyebrow">All done</p>
            <h1 id="cooking-complete-heading">Cooking Complete!</h1>
            <p>You finished all {usableSteps.length} steps.</p>
            <button className="button button--primary" type="button" onClick={onExit}>
              Back to Recipe
            </button>
          </section>
        </div>
      </div>
    );
  }

  const currentStep = usableSteps[currentStepIndex];
  const equipment = Array.isArray(currentStep.equipment)
    ? currentStep.equipment.filter((item) => typeof item === 'string' && item.trim())
    : [];
  const stepNumber = currentStepIndex + 1;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === usableSteps.length - 1;
  const progressPercent = (stepNumber / usableSteps.length) * 100;

  return (
    <div className="cooking-mode">
      <div className="cooking-mode__inner">
        <button className="cooking-mode__back" type="button" onClick={onExit}>
          <span aria-hidden="true">←</span> Back to recipe
        </button>

        <section className="cooking-mode__content" aria-labelledby="cooking-step-heading">
          <p className="eyebrow">Cooking mode</p>
          <div className="cooking-mode__heading-row">
            <span className="cooking-mode__step-count">Step {stepNumber} of {usableSteps.length}</span>
            <span className="cooking-mode__step-number" aria-hidden="true">{stepNumber}</span>
          </div>
          <div
            className="cooking-mode__progress-track"
            role="progressbar"
            aria-label={`Cooking progress: step ${stepNumber} of ${usableSteps.length}`}
            aria-valuemin="1"
            aria-valuemax={usableSteps.length}
            aria-valuenow={stepNumber}
          >
            <div className="cooking-mode__progress-value" style={{ width: `${progressPercent}%` }} />
          </div>

          <h1 id="cooking-step-heading">{currentStep.text}</h1>

          {equipment.length > 0 && (
            <div className="cooking-mode__equipment">
              <h2>Equipment</h2>
              <ul>
                {equipment.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}

          <div className="cooking-mode__controls">
            <button
              className="button button--secondary"
              type="button"
              onClick={() => setCurrentStepIndex((index) => Math.max(0, index - 1))}
              disabled={isFirstStep}
            >
              Previous
            </button>
            <span aria-hidden="true">{stepNumber} / {usableSteps.length}</span>
            <button
              className="button button--primary"
              type="button"
              onClick={() => {
                if (isLastStep) {
                  setIsComplete(true);
                  return;
                }

                setCurrentStepIndex((index) => Math.min(usableSteps.length - 1, index + 1));
              }}
            >
              {isLastStep ? 'Finish Cooking' : 'Next'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CookingMode;
