function StateMessage({ variant = 'empty', title, description, action }) {
  return (
    <section className={`state-message state-message--${variant}`} role={variant === 'error' ? 'alert' : undefined}>
      <div className="state-message__icon" aria-hidden="true">
        {variant === 'loading' ? '•••' : variant === 'error' ? '!' : '⌕'}
      </div>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        {action}
      </div>
    </section>
  );
}

export default StateMessage;
