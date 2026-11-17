import { cx } from '../../utils/cx';

// padding: sm | md | lg | flush
export function Card({
  as: Tag = 'section',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cx(
        'ui-card',
        padding !== 'md' && `ui-card--${padding}`,
        interactive && 'ui-card--interactive',
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ eyebrow, title, subtitle, actions, headingLevel = 2 }) {
  const Heading = `h${headingLevel}`;

  return (
    <div className="ui-card-header">
      <div>
        {eyebrow && <span className="ui-card-header__eyebrow">{eyebrow}</span>}
        <Heading className="ui-card-header__title">{title}</Heading>
        {subtitle && <p className="ui-card-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="ui-card-header__actions">{actions}</div>}
    </div>
  );
}
