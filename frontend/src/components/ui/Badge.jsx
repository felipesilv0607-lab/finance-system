import { cx } from '../../utils/cx';
import Icon from './Icon';

// tone: neutral | primary | success | danger | warning | info
function Badge({ tone = 'neutral', icon, dot = false, className, children }) {
  return (
    <span
      className={cx(
        'ui-badge',
        tone !== 'neutral' && `ui-badge--${tone}`,
        className
      )}
    >
      {dot && <span className="ui-badge__dot" aria-hidden="true" />}
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

export default Badge;
