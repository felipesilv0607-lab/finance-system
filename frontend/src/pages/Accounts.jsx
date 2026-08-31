import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { getAccounts } from '../services/accountsService';

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAccounts() {
      try {
        const data = await getAccounts();
        setAccounts(data);
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar as contas.');
      } finally {
        setLoading(false);
      }
    }

    loadAccounts();
  }, []);

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  return (
    <AppLayout title="Contas" section="FINANÇAS">
      <section className="dashboard">
        <div className="dashboard-welcome">
          <span>FINANÇAS</span>
          <h2>Minhas contas</h2>
          <p>
            Visualize e acompanhe o saldo das suas contas.
          </p>
        </div>

        {loading && (
          <div className="dashboard-section">
            <p>Carregando contas...</p>
          </div>
        )}

        {error && (
          <div className="dashboard-section">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="accounts-grid">
            {accounts.map((account) => (
              <article className="account-card" key={account.id}>
                <div className="account-card-top">
                  <div>
                    <span className="account-type">{account.type}</span>
                    <h3>{account.name}</h3>
                  </div>

                  <div className="account-icon">
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="account-balance">
                  <span>Saldo</span>
                  <strong>{formatCurrency(account.initialBalance)}</strong>
                </div>
              </article>
            ))}

            {accounts.length === 0 && (
              <div className="dashboard-section">
                <div className="empty-state">
                  <h4>Nenhuma conta cadastrada</h4>
                  <p>
                    Quando você adicionar uma conta, ela aparecerá aqui.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export default Accounts;
