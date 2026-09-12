import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import {
  getAccounts,
  createAccount,
  updateAccount,
} from '../services/accountsService';

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

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

  async function handleCreateAccount(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setError('');

      const newAccount = await createAccount({
        name,
        type,
        initialBalance: Number(initialBalance),
      });

      setAccounts((currentAccounts) => [
        ...currentAccounts,
        newAccount,
      ]);

      setName('');
      setType('');
      setInitialBalance('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  const formatAccountType = (type) => {
    const types = {
      BANK: 'Conta bancária',
      CASH: 'Dinheiro',
      INVESTMENT: 'Investimento',
      OTHER: 'Outra',
    };

    return types[type] || type;
  };

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

        <section className="dashboard-section account-form-section">
          <div className="section-heading">
            <div>
              <span>CADASTRO</span>

              <h3>Nova conta</h3>
            </div>
          </div>

          <form
            onSubmit={handleCreateAccount}
            className="account-form"
          >
            <div className="form-field">
              <label htmlFor="account-name">
                Nome da conta
              </label>

              <input
                id="account-name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Ex.: Nubank"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="account-type">
                Tipo de conta
              </label>

              <select
                id="account-type"
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
                required
              >
                <option value="">
                  Selecione o tipo
                </option>

                <option value="BANK">
                  Conta bancária
                </option>

                <option value="CASH">
                  Dinheiro
                </option>

                <option value="INVESTMENT">
                  Investimento
                </option>

                <option value="OTHER">
                  Outra
                </option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="account-balance">
                Saldo inicial
              </label>

              <input
                id="account-balance"
                type="number"
                value={initialBalance}
                onChange={(event) =>
                  setInitialBalance(event.target.value)
                }
                placeholder="0,00"
                step="0.01"
                required
              />
            </div>

            <button
              type="submit"
              className="account-submit-button"
              disabled={creating}
            >
              {creating ? 'Criando...' : 'Criar conta'}
            </button>
          </form>
        </section>

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
              <article
                className="account-card"
                key={account.id}
              >
                <div className="account-card-top">
                  <div>
                    <span className="account-type">
                      {formatAccountType(account.type)}
                    </span>

                    <h3>{account.name}</h3>
                  </div>

                  <div className="account-icon">
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="account-balance">
                  <span>Saldo</span>

                  <strong>
                    {formatCurrency(account.initialBalance)}
                  </strong>
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
