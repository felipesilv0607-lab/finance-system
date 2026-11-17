import { cx } from '../../utils/cx';
import Icon from './Icon';
import Spinner from './Spinner';

// variant: primary | secondary | ghost | danger   size: sm | md | lg
function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  type = 'button',
  disabled,
  className,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={cx(
        'ui-btn',
        `ui-btn--${variant}`,
        size !== 'md' && `ui-btn--${size}`,
        fullWidth && 'ui-btn--block',
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner /> : icon && <Icon name={icon} size={16} />}
      {children}
      {!loading && iconRight && <Icon name={iconRight} size={16} />}
    </button>
  );
}

export default Button;
