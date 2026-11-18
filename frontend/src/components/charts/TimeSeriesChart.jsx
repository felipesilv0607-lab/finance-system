import { useEffect, useId, useRef, useState } from 'react';
import { formatCurrency } from '../../utils/money';
import {
  areaPath,
  bandCenter,
  bucketLabel,
  bucketLongLabel,
  formatAxis,
  labelIndexes,
  linePath,
  nearestIndex,
  niceScale,
  scaleY
} from '../../utils/chart';

const DEFAULT_WIDTH = 640;

// Largura real do contêiner: o viewBox acompanha os pixels, então textos e
// traços mantêm o tamanho legível também em telas estreitas.
function useElementWidth(ref) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  useEffect(() => {
    const element = ref.current;

    if (!element || typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);

      if (next > 0) setWidth(next);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return width;
}

// variant="bars": barras agrupadas (uma por série). variant="line": área + linha
// da primeira série. series: [{ key, label, color }]. Cada ponto de `points`
// traz `date` e as strings decimais de cada série.
function TimeSeriesChart({ points, series, granularity, variant, title, description }) {
  const uid = useId();
  const frameRef = useRef(null);
  const WIDTH = useElementWidth(frameRef);
  const narrow = WIDTH < 480;
  const HEIGHT = narrow ? 230 : 260;
  const MARGIN = { top: 14, right: 12, bottom: 30, left: narrow ? 44 : 52 };
  const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
  const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;
  const [active, setActive] = useState(null);
  const count = points.length;
  const values = points.flatMap((point) => series.map((item) => Number(point[item.key])));
  const scale = niceScale(Math.min(...values, 0), Math.max(...values, 0));
  const y = (value) => scaleY(value, scale, MARGIN.top, PLOT_H);
  const zeroY = y(0);
  const selected = active !== null && active < count ? active : null;

  const handlePointer = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width) * WIDTH;

    setActive(nearestIndex(x, count, MARGIN.left, PLOT_W));
  };

  const handleKey = (event) => {
    const last = count - 1;
    const current = selected ?? (event.key === 'ArrowLeft' ? last + 1 : -1);
    const moves = {
      ArrowRight: Math.min(last, current + 1),
      ArrowLeft: Math.max(0, current - 1),
      Home: 0,
      End: last
    };

    if (event.key in moves) {
      event.preventDefault();
      setActive(moves[event.key]);
    } else if (event.key === 'Escape') {
      setActive(null);
    }
  };

  const barBand = PLOT_W / count;
  const barWidth = Math.max(2, Math.min(18, (barBand * 0.7) / series.length));
  const readout = selected !== null ? points[selected] : null;

  return (
    <figure className="dash-chart">
      <div
        ref={frameRef}
        className="dash-chart__frame"
        tabIndex={0}
        role="group"
        aria-label={`${title}. Use as setas para percorrer os períodos.`}
        aria-describedby={`${uid}-readout`}
        onPointerMove={handlePointer}
        onPointerLeave={() => setActive(null)}
        onKeyDown={handleKey}
        onBlur={() => setActive(null)}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby={`${uid}-t ${uid}-d`}>
          <title id={`${uid}-t`}>{title}</title>
          <desc id={`${uid}-d`}>{description}</desc>

          {scale.ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={WIDTH - MARGIN.right}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0 ? 'dash-chart__zero' : 'dash-chart__grid'}
              />
              <text x={MARGIN.left - 8} y={y(tick)} className="dash-chart__tick" textAnchor="end" dominantBaseline="middle">
                {formatAxis(tick)}
              </text>
            </g>
          ))}

          {labelIndexes(count, narrow ? 4 : 6).map((index) => (
            <text
              key={points[index].date}
              x={bandCenter(index, count, MARGIN.left, PLOT_W)}
              y={HEIGHT - 8}
              className="dash-chart__tick"
              textAnchor="middle"
            >
              {bucketLabel(points[index].date, granularity)}
            </text>
          ))}

          {variant === 'bars' &&
            points.map((point, index) => {
              const center = bandCenter(index, count, MARGIN.left, PLOT_W);

              return series.map((item, seriesIndex) => {
                const value = Number(point[item.key]);
                const top = y(Math.max(value, 0));
                const x = center + (seriesIndex - (series.length - 1) / 2) * barWidth - barWidth / 2;

                return value === 0 ? null : (
                  <rect
                    key={`${point.date}-${item.key}`}
                    x={x}
                    y={top}
                    width={barWidth - 1}
                    height={Math.max(1, Math.abs(y(value) - zeroY))}
                    rx="2"
                    fill={item.color}
                    opacity={selected === null || selected === index ? 1 : 0.45}
                  />
                );
              });
            })}

          {variant === 'line' && (() => {
            const line = points.map((point, index) => [
              bandCenter(index, count, MARGIN.left, PLOT_W),
              y(Number(point[series[0].key]))
            ]);

            return (
              <>
                <path d={areaPath(line, zeroY)} fill={series[0].color} opacity="0.12" />
                <path d={linePath(line)} fill="none" stroke={series[0].color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {count <= 31 && line.map(([x, py], index) => (
                  <circle key={points[index].date} cx={x} cy={py} r={selected === index ? 5 : 2.5} fill={series[0].color} />
                ))}
              </>
            );
          })()}

          {selected !== null && (
            <line
              x1={bandCenter(selected, count, MARGIN.left, PLOT_W)}
              x2={bandCenter(selected, count, MARGIN.left, PLOT_W)}
              y1={MARGIN.top}
              y2={HEIGHT - MARGIN.bottom}
              className="dash-chart__guide"
            />
          )}
        </svg>
      </div>

      <figcaption id={`${uid}-readout`} className="dash-chart__readout" aria-live="polite">
        {readout ? (
          <>
            <strong>{bucketLongLabel(readout.date, granularity)}</strong>
            {series.map((item) => (
              <span key={item.key} className="dash-chart__reading">
                <i style={{ background: item.color }} aria-hidden="true" />
                {item.label}: <b className="num">{formatCurrency(readout[item.key])}</b>
              </span>
            ))}
          </>
        ) : (
          <span className="dash-chart__hint">Passe o mouse ou use as setas para ver os valores.</span>
        )}
      </figcaption>

      {variant === 'bars' && (
        <ul className="dash-legend">
          {series.map((item) => (
            <li key={item.key}>
              <i style={{ background: item.color }} aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      <details className="dash-chart__data">
        <summary>Ver dados em tabela</summary>
        <div className="table-container">
          <table>
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                <th scope="col">Período</th>
                {series.map((item) => (
                  <th key={item.key} scope="col">{item.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.date}>
                  <th scope="row">{bucketLongLabel(point.date, granularity)}</th>
                  {series.map((item) => (
                    <td key={item.key} className="num">{formatCurrency(point[item.key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

export default TimeSeriesChart;
