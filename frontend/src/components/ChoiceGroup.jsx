export default function ChoiceGroup({
  name,
  legend,
  labelledBy,
  value,
  onChange,
  options,
  className = 'type-options',
  optionClass = 'type-option',
  disabled = false,
  error = '',
  errorClassName = 'field-error',
  mark = false,
}) {
  const errorId = error ? `${name}-error` : undefined

  return (
    <fieldset className="type-field" aria-labelledby={labelledBy} aria-describedby={errorId}>
      {legend ? <legend>{legend}</legend> : null}
      <div className={className}>
        {options.map((item) => {
          const selected = value === item.id
          return (
            <label key={item.id} className={selected ? `${optionClass} is-selected` : optionClass}>
              <input
                type="radio"
                name={name}
                value={item.id}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(item.id)}
              />
              <span>{item.label}</span>
              {mark ? (
                <span className="choice-mark" aria-hidden="true">
                  {selected ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M3.75 9.25L7.1 12.6L14.25 5.4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : null}
                </span>
              ) : null}
            </label>
          )
        })}
      </div>
      {error ? (
        <p className={errorClassName} id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
