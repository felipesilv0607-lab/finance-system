// Geometria dos gráficos SVG. Só cuida de escala e posição (números para
// desenhar); os valores exibidos ao usuário continuam sendo as strings
// decimais da API, formatadas por formatCurrency.

// Escala "bonita" que sempre inclui o zero.
export function niceScale(min, max, tickCount = 4) {
  const low = Math.min(0, min);
  const high = Math.max(0, max);

  if (low === high) {
    return { min: 0, max: 1, ticks: [0, 1] };
  }

  const rawStep = (high - low) / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const residual = rawStep / magnitude;
  const factor = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  const step = factor * magnitude;
  const niceMin = Math.floor(low / step) * step;
  const niceMax = Math.ceil(high / step) * step;
  const ticks = [];

  for (let value = niceMin; value <= niceMax + step / 2; value += step) {
    ticks.push(Number(value.toPrecision(12)));
  }

  return { min: niceMin, max: niceMax, ticks };
}

// Mapeia valor -> coordenada y (SVG cresce para baixo).
export function scaleY(value, scale, top, height) {
  return top + height - ((value - scale.min) / (scale.max - scale.min)) * height;
}

// Posição x do centro de cada categoria, em uma faixa [left, left + width].
export function bandCenter(index, count, left, width) {
  return left + ((index + 0.5) * width) / count;
}

export function linePath(points) {
  return points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
}

export function areaPath(points, baselineY) {
  if (points.length === 0) return '';

  const first = points[0];
  const last = points[points.length - 1];

  return `${linePath(points)} L${last[0].toFixed(1)} ${baselineY.toFixed(1)} L${first[0].toFixed(1)} ${baselineY.toFixed(1)} Z`;
}

// Índice mais próximo de um x (em unidades do viewBox).
export function nearestIndex(x, count, left, width) {
  if (count <= 0) return -1;

  const index = Math.floor(((x - left) / width) * count);

  return Math.min(count - 1, Math.max(0, index));
}

// Rótulos do eixo x: no máximo `max`, sempre incluindo o primeiro.
export function labelIndexes(count, max = 6) {
  if (count <= max) return Array.from({ length: count }, (_, index) => index);

  const step = Math.ceil(count / max);

  return Array.from({ length: count }, (_, index) => index).filter(
    (index) => index % step === 0
  );
}

// "2026-11-02" -> "02/11" (dia) ou "nov/26" (mês). Sem Date: evita fuso.
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function bucketLabel(key, granularity) {
  const [year, month, day] = key.split('-');

  return granularity === 'month'
    ? `${MONTHS[Number(month) - 1]}/${year.slice(2)}`
    : `${day}/${month}`;
}

export function bucketLongLabel(key, granularity) {
  const [year, month, day] = key.split('-');

  return granularity === 'month'
    ? `${MONTHS[Number(month) - 1]} de ${year}`
    : `${day}/${month}/${year}`;
}

// Rosca: segmentos com dasharray/offset sobre uma circunferência.
export function donutSegments(values, circumference, gap = 0) {
  const total = values.reduce((sum, value) => sum + value, 0);

  if (total <= 0) return [];

  let offset = 0;

  return values.map((value) => {
    const length = (value / total) * circumference;
    const visible = Math.max(0, length - (values.length > 1 ? gap : 0));
    const segment = { length: visible, offset: -offset, gap: circumference - visible };

    offset += length;

    return segment;
  });
}

// Abrevia valores do eixo: 1.2 mil, 3,5 mi.
export function formatAxis(value) {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';

  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;

  return `${sign}${abs.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}
