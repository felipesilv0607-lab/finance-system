import { useId } from 'react';
import { cx } from '../../utils/cx';
import Icon from './Icon';

function FieldShell({ id, label, hint, error, required, prefix, disabled, suffix, children }) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className="ui-field">
      {label && (
        <label className="ui-field__label" htmlFor={id}>
          {label}
          {required && (
            <span className="ui-field__required" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}

      <div
        className={cx(
          'ui-field__control',
          error && 'has-error',
          disabled && 'is-disabled'
        )}
      >
        {prefix && <span className="ui-field__prefix">{prefix}</span>}
        {children({
          describedBy: error ? errorId : hint ? hintId : undefined,
        })}
        {suffix}
      </div>

      {error ? (
        <p className="ui-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p className="ui-field__hint" id={hintId}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function Input({ id, label, hint, error, required, prefix, className, disabled, ...rest }) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <FieldShell
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      prefix={prefix}
      disabled={disabled}
    >
      {({ describedBy }) => (
        <input
          id={inputId}
          className={cx('ui-field__input', className)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          disabled={disabled}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

// `children` são os <option>. Use um <option value=""> como placeholder.
export function Select({ id, label, hint, error, required, className, disabled, children, ...rest }) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <FieldShell
      id={selectId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      disabled={disabled}
      suffix={<Icon name="chevron-down" size={16} className="ui-field__chevron" />}
    >
      {({ describedBy }) => (
        <select
          id={selectId}
          className={cx('ui-field__input', className)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          disabled={disabled}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}
