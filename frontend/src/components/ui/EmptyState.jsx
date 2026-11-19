import Icon from './Icon';

function EmptyState({ icon = 'search', title, description, action }) {
  return (
    <div className="ui-empty">
      <div className="ui-empty__icon">
        <Icon name={icon} size={26} />
      </div>
      <h3 className="ui-empty__title">{title}</h3>
      {description && <p className="ui-empty__description">{description}</p>}
      {action && <div className="ui-empty__action">{action}</div>}
    </div>
  );
}

export default EmptyState;
