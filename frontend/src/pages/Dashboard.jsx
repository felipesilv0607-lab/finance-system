import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { getAccounts } from '../services/accountsService';

function Dashboard() {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const data = await getAccounts();
        setAccounts(data);
      } catch (error) {
        console.error('Erro ao carregar contas:', error);
      }
    }

    loadAccounts();
  }, []);

  const totalBalance = accounts.reduce(
    (total, account) => total + Number(account.initialBalance || 0),
    0
  );

  const formatCurrency = (value) =>
    value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  return (
    <AppLayout title="Dashboard" section="VISÃO GERAL">
      <section className="dashboard">
        <div className="dashboard-welcome">
          <span>VISÃO GERAL</span>
          <h2>Seu dinheiro, sob controle.</h2>
          <p>
            Acompanhe suas contas, receitas e despesas em um só lugar.
          </p>
        </div>

        <div className="summary-grid">
          <article className="summary-card">
            <span>Saldo total</span>
            <strong>{formatCurrency(totalBalance)}</strong>
            <small>Em todas as contas</small>
          </article>

          <article className="summary-card">
            <span>Receitas</span>
            <strong>R$ 0,00</strong>
            <small>Neste período</small>
          </article>

          <article className="summary-card">
            <span>Despesas</span>
            <strong>R$ 0,00</strong>
            <small>Neste período</small>
          </article>
        </div>

        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <span>ATIVIDADE</span>
              <h3>Movimentações recentes</h3>
            </div>
          </div>

          <div className="empty-state">
            <h4>Nenhuma movimentação ainda</h4>
            <p>
              Quando você registrar receitas ou despesas, elas aparecerão aqui.
            </p>
          </div>
        </section>
      </section>
    </AppLayout>
  );
}

export default Dashboard;
