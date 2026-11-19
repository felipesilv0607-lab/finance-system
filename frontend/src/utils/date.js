// Datas de formulário usam o fuso LOCAL do usuário. toISOString() converte
// para UTC e, à noite no Brasil, devolveria o dia seguinte.

function pad(number) {
  return String(number).padStart(2, '0');
}

export function toDateInputValue(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Extrai YYYY-MM-DD de uma data da API no fuso local.
export function apiDateToInputValue(value) {
  return toDateInputValue(new Date(value));
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('pt-BR');
}

// Início do mês corrente e do próximo, em ISO (UTC) a partir do fuso local.
export function currentMonthRange(now = new Date()) {
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return { from: from.toISOString(), to: to.toISOString() };
}
