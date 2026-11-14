import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { getDashboardSummary } from '../services/dashboardService';
import { currentMonthRange, formatDate } from '../utils/date';
import { formatCurrency } from '../utils/money';

const typeLabels = { INCOME: 'Receita', EXPENSE: 'Despesa' };

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getDashboardSummary(currentMonthRange())
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((requestError) => {
        console.error(requestError);
        if (active) setError('Não foi possível carregar o resumo financeiro.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const recent = summary?.recentTransactions ?? [];
  const value = (key) => (loading || error ? '—' : formatCurrency(summary?.[key]));

  return (
    <AppLayout title="Dashboard" section="VISÃO GERAL">
      <section className="dashboard">
        <div className="dashboard-welcome">
          <span>VISÃO GERAL</span>
          <h2>Seu dinheiro, sob controle.</h2>
          <p>Acompanhe suas contas, receitas e despesas em um só lugar.</p>
        </div>

        {error && (
          <div className="dashboard-section" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="summary-grid" aria-busy={loading}>
          <article className="summary-card">
            <span>Saldo total</span>
            <strong>{value('totalBalance')}</strong>
            <small>Saldo inicial + receitas − despesas, em todas as contas</small>
          </article>

          <article className="summary-card">
            <span>Receitas</span>
            <strong>{value('income')}</strong>
            <small>Neste mês</small>
          </article>

          <article className="summary-card">
            <span>Despesas</span>
            <strong>{value('expense')}</strong>
            <small>Neste mês</small>
          </article>
        </div>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span>ATIVIDADE</span>
              <h3>Movimentações recentes</h3>
            </div>
          </div>

          {loading && <p>Carregando...</p>}

          {!loading && !error && recent.length === 0 && (
            <div className="empty-state">
              <h4>Nenhuma movimentação ainda</h4>
              <p>
                Quando você registrar receitas ou despesas, elas aparecerão aqui.
              </p>
            </div>
          )}

          {recent.length > 0 && (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Conta</th>
                    <th>Categoria</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.date)}</td>
                      <td>{transaction.description}</td>
                      <td>{transaction.accountName}</td>
                      <td>{transaction.categoryName}</td>
                      <td>{typeLabels[transaction.type]}</td>
                      <td>
                        {transaction.type === 'EXPENSE' ? '− ' : ''}
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </AppLayout>
  );
}

export default Dashboard;
