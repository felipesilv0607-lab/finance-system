import { cx } from '../../utils/cx';

// Bloco de carregamento. O contêiner deve usar aria-busy="true".
function Skeleton({ width = '100%', height = 16, radius, className }) {
  return (
    <span
      className={cx('ui-skeleton', className)}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export default Skeleton;
