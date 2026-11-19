import Icon from './ui/Icon';
import IconButton from './ui/IconButton';
import { movementVisual } from '../config/movements';
import { formatCurrency } from '../utils/money';
import { apiDateToInputValue, formatDate } from '../utils/date';

// Linha de lançamento (Receitas, Despesas, Transações e movimentações recentes
// do Dashboard). Tom, ícone e sinal vêm do tipo do lançamento. As ações de
// editar/excluir só aparecem quando onEdit/onDelete são passados.
function MovementRow({
  transaction,
  categoryName,
  accountName,
  noun,
  editing = false,
  busy = false,
  deleting = false,
  onEdit,
  onDelete,
}) {
  const visual = movementVisual(transaction.type);
  const label = noun ?? visual.noun;

  return (
    <li className={`mov-row mov-row--${visual.tone}${editing ? ' is-editing' : ''}`}>
      <span className="mov-row__icon" aria-hidden="true">
        <Icon name={visual.icon} size={18} />
      </span>

      <div className="mov-row__main">
        <span className="mov-row__title">
          <span className="mov-row__text">{transaction.description}</span>
          {editing && <span className="mov-row__editing">Em edição</span>}
        </span>
        <span className="mov-row__meta">
          <time dateTime={apiDateToInputValue(transaction.date)}>
            {formatDate(transaction.date)}
          </time>
          {' · '}{categoryName}{' · '}{accountName}
        </span>
      </div>

      <span className="mov-row__amount num">
        <span className="sr-only">{visual.Noun}: </span>{visual.sign} {formatCurrency(transaction.amount)}
      </span>

      {(onEdit || onDelete) && (
        <div className="mov-row__actions">
          {onEdit && (
            <IconButton
              icon="edit"
              label={`Editar ${label} ${transaction.description}`}
              size="sm"
              onClick={() => onEdit(transaction)}
              disabled={busy || deleting}
            />
          )}
          {onDelete && (
            <IconButton
              icon="trash"
              label={`Excluir ${label} ${transaction.description}`}
              size="sm"
              tone="danger"
              onClick={() => onDelete(transaction)}
              disabled={busy || deleting}
            />
          )}
        </div>
      )}
    </li>
  );
}

export default MovementRow;
