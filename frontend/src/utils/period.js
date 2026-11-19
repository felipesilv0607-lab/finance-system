// Períodos do filtro do Dashboard. Os dias do período são os do calendário
// LOCAL do usuário ("este mês" = o mês de hoje no fuso dele), mas os limites
// [from, to) enviados à API são a meia-noite UTC desses dias: é assim que a API
// grava as datas de lançamento ("2026-11-01" -> 2026-11-01T00:00:00.000Z).
// Com meia-noite local, em UTC-3 o dia 1º ficava fora do mês e o dia 1º do
// mês seguinte entrava nele.

export const PERIOD_OPTIONS = [
  { value: 'this-month', label: 'Este mês' },
  { value: 'last-month', label: 'Mês passado' },
  { value: 'last-30', label: 'Últimos 30 dias' },
  { value: 'last-90', label: 'Últimos 90 dias' },
  { value: 'this-year', label: 'Este ano' }
];

export const DEFAULT_PERIOD = 'this-month';

// Meia-noite UTC de um dia de calendário (Date.UTC normaliza estouros de
// mês/dia, ex.: dia 0 = último dia do mês anterior).
function utcDay(year, month, day) {
  return new Date(Date.UTC(year, month, day));
}

export function periodRange(value, now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  let from;
  let to;

  switch (value) {
    case 'last-month':
      from = utcDay(year, month - 1, 1);
      to = utcDay(year, month, 1);
      break;
    case 'last-30':
    case 'last-90': {
      const days = value === 'last-30' ? 30 : 90;

      // Inclui hoje inteiro: termina no início de amanhã.
      to = utcDay(year, month, day + 1);
      from = utcDay(year, month, day + 1 - days);
      break;
    }
    case 'this-year':
      from = utcDay(year, 0, 1);
      to = utcDay(year + 1, 0, 1);
      break;
    case 'this-month':
    default:
      from = utcDay(year, month, 1);
      to = utcDay(year, month + 1, 1);
  }

  return { from: from.toISOString(), to: to.toISOString() };
}

export function periodLabel(value) {
  return PERIOD_OPTIONS.find((option) => option.value === value)?.label ?? 'Este mês';
}
