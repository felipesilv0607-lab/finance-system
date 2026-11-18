import { cx } from '../../utils/cx';
import { icons } from './icons';

// Ícone decorativo por padrão (aria-hidden). Passe `title` para torná-lo
// um elemento com nome acessível.
function Icon({ name, size = 20, title, className, ...rest }) {
  const paths = icons[name];

  if (!paths) {
    return null;
  }

  return (
    <svg
      className={cx('ui-icon', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
      {...rest}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export default Icon;
