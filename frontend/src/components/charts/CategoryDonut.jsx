import { useId } from 'react';
import { formatCurrency } from '../../utils/money';
import { donutSegments } from '../../utils/chart';

const SIZE = 180;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Cores com contraste >= 3:1 sobre o fundo claro; o texto da legenda (nome,
// valor e %) garante que a cor nunca é a única informação.
const PALETTE = [
  'var(--color-primary-600)',
  'var(--color-danger-500)',
  'var(--color-warning-700)',
  'var(--color-success-700)',
  'var(--color-info-700)',
  'var(--color-neutral-700)'
];
const OTHER_COLOR = 'var(--color-neutral-400)';

function CategoryDonut({ items, total }) {
  const uid = useId();
  const segments = donutSegments(
    items.map((item) => Number(item.amount)),
    CIRCUMFERENCE,
    2
  );
  const colorOf = (item, index) => (item.categoryId === null ? OTHER_COLOR : PALETTE[index % PALETTE.length]);

  return (
    <div className="dash-donut">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-labelledby={`${uid}-t`} className="dash-donut__svg">
        <title id={`${uid}-t`}>
          {`Despesas por categoria. Total ${formatCurrency(total)}. ${items
            .map((item) => `${item.name} ${item.percentage.toLocaleString('pt-BR')}%`)
            .join(', ')}.`}
        </title>
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          {segments.map((segment, index) => (
            <circle
              key={items[index].categoryId ?? 'other'}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={colorOf(items[index], index)}
              strokeWidth={STROKE}
              strokeDasharray={`${segment.length} ${segment.gap}`}
              strokeDashoffset={segment.offset}
            />
          ))}
        </g>
        <text x="50%" y="46%" textAnchor="middle" className="dash-donut__label">Despesas</text>
        <text x="50%" y="58%" textAnchor="middle" className="dash-donut__total">{formatCurrency(total)}</text>
      </svg>

      <ul className="dash-donut__legend">
        {items.map((item, index) => (
          <li key={item.categoryId ?? 'other'}>
            <i style={{ background: colorOf(item, index) }} aria-hidden="true" />
            <span className="dash-donut__name">{item.name}</span>
            <span className="num dash-donut__amount">{formatCurrency(item.amount)}</span>
            <span className="num dash-donut__pct">{item.percentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CategoryDonut;
