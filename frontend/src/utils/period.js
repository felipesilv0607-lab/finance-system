// Períodos do filtro do Dashboard, no fuso LOCAL do usuário. A API recebe
// o intervalo [from, to) em ISO (UTC).

export const PERIOD_OPTIONS = [
  { value: 'this-month', label: 'Este mês' },
  { value: 'last-month', label: 'Mês passado' },
  { value: 'last-30', label: 'Últimos 30 dias' },
  { value: 'last-90', label: 'Últimos 90 dias' },
  { value: 'this-year', label: 'Este ano' }
];

export const DEFAULT_PERIOD = 'this-month';

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function periodRange(value, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  let from;
  let to;

  switch (value) {
    case 'last-month':
      from = new Date(year, month - 1, 1);
      to = new Date(year, month, 1);
      break;
    case 'last-30':
    case 'last-90': {
      const days = value === 'last-30' ? 30 : 90;
      const today = startOfDay(now);

      to = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - days);
      break;
    }
    case 'this-year':
      from = new Date(year, 0, 1);
      to = new Date(year + 1, 0, 1);
      break;
    case 'this-month':
    default:
      from = new Date(year, month, 1);
      to = new Date(year, month + 1, 1);
  }

  return { from: from.toISOString(), to: to.toISOString() };
}

export function periodLabel(value) {
  return PERIOD_OPTIONS.find((option) => option.value === value)?.label ?? 'Este mês';
}
