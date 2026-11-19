import { useEffect, useState } from 'react';
import { getDashboardOverview } from '../services/dashboardService';

// Busca a visão do Dashboard sempre que os filtros mudam. `loading` é derivado
// (a resposta guardada ainda é de outra chave), sem setState síncrono no efeito.
export function useDashboardOverview({ from, to, accountId, categoryId }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const key = [from, to, accountId, categoryId, attempt].join('|');

  useEffect(() => {
    let active = true;

    getDashboardOverview({ from, to, accountId, categoryId })
      .then((data) => {
        if (active) setResult({ key, data, error: null });
      })
      .catch((error) => {
        console.error(error);
        if (active) setResult({ key, data: null, error });
      });

    return () => {
      active = false;
    };
  }, [key, from, to, accountId, categoryId]);

  const loading = result.key !== key;

  return {
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
    reload: () => setAttempt((value) => value + 1)
  };
}
