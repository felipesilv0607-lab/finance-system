import { cx } from '../../utils/cx';
import Icon from './Icon';

// Botão só com ícone: `label` é obrigatório (nome acessível + tooltip nativo).
function IconButton({
  icon,
  label,
  size = 'md',
  tone,
  type = 'button',
  className,
  ...rest
}) {
  return (
    <button
      type={type}
      className={cx(
        'ui-icon-btn',
        size === 'sm' && 'ui-icon-btn--sm',
        tone === 'danger' && 'ui-icon-btn--danger',
        className
      )}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 18} />
    </button>
  );
}

export default IconButton;
