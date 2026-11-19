// Dois tipos de data no app:
//
// - "Hoje" do usuário (padrão dos formulários): é o dia LOCAL. toISOString()
//   converteria para UTC e, à noite no Brasil, devolveria o dia seguinte.
//
// - Data de um LANÇAMENTO (transaction.date): é um dia de calendário. A API
//   grava "2026-11-19" como meia-noite UTC (2026-11-19T00:00:00.000Z). Lida com
//   getters locais, mostraria o dia anterior em fusos negativos (UTC-3) e uma
//   edição salva sem mexer na data recuaria um dia. Por isso é lida em UTC.
//   (createdAt/updatedAt são instantes reais e não passam por estas funções.)

function pad(number) {
  return String(number).padStart(2, '0');
}

export function toDateInputValue(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Dia de calendário (YYYY-MM-DD) de uma data de lançamento vinda da API.
export function apiDateToInputValue(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

// Data de lançamento para exibição (dd/mm/aaaa), no mesmo dia gravado.
export function formatDate(value) {
  const [year, month, day] = apiDateToInputValue(value).split('-');

  return year ? `${day}/${month}/${year}` : '';
}

// Início do mês corrente e do próximo, em ISO (UTC) a partir do fuso local.
export function currentMonthRange(now = new Date()) {
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return { from: from.toISOString(), to: to.toISOString() };
}
