import { get } from './api';

export async function getDashboardSummary({ from, to } = {}) {
  const params = from && to
    ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    : '';

  return get(`/dashboard/summary${params}`);
}
