import { get } from './api';

export async function getDashboardSummary({ from, to } = {}) {
  const params = from && to
    ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    : '';

  return get(`/dashboard/summary${params}`);
}

// Visão do Dashboard: totais, série temporal, despesas por categoria e
// movimentações recentes, com filtros opcionais de conta e categoria.
export async function getDashboardOverview({ from, to, accountId, categoryId } = {}) {
  const params = new URLSearchParams();

  if (from && to) {
    params.set('from', from);
    params.set('to', to);
  }

  if (accountId) params.set('accountId', accountId);
  if (categoryId) params.set('categoryId', categoryId);

  const query = params.toString();

  return get(`/dashboard/overview${query ? `?${query}` : ''}`);
}
