import { cx } from '../../utils/cx';
import { getInitials } from '../../utils/initials';

// Círculo com as iniciais. Decorativo: o nome já aparece em texto ao lado.
function Avatar({ name, size = 'md', className }) {
  return (
    <span
      className={cx('ui-avatar', size !== 'md' && `ui-avatar--${size}`, className)}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

export default Avatar;
