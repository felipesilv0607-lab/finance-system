import { cx } from '../../utils/cx';

// `label` torna o spinner anunciável por leitores de tela;
// sem label ele é decorativo.
function Spinner({ size, label, className }) {
  return (
    <span
      className={cx('ui-spinner', size === 'lg' && 'ui-spinner--lg', className)}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
    />
  );
}

export default Spinner;
