import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../services/accountsService';
import {
  formatAmountInput,
  formatAmountOnBlur,
} from '../utils/amount';

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  const [editingAccount, setEditingAccount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState(null);

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

  function clearForm() {
    setName('');
    setType('');
    setInitialBalance('');
    setEditingAccount(null);
  }

  async function handleSubmitAccount(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');

      const accountData = {
        name,
        type,
        initialBalance: Number(initialBalance),
      };

      if (editingAccount) {
        const updatedAccount = await updateAccount(
          editingAccount.id,
          accountData
        );

        setAccounts((currentAccounts) =>
          currentAccounts.map((account) =>
            account.id === updatedAccount.id
              ? updatedAccount
              : account
          )
        );
      } else {
        const newAccount = await createAccount(accountData);

        setAccounts((currentAccounts) => [
          ...currentAccounts,
          newAccount,
        ]);
      }

      clearForm();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEditAccount(account) {
    setEditingAccount(account);
    setName(account.name);
    setType(account.type);
    setInitialBalance(
      formatAmountInput(String(account.initialBalance))
    );
    setError('');
  }

  function handleCancelEdit() {
    clearForm();
    setError('');
  }

  async function handleDeleteAccount(account) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a conta "${account.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAccountId(account.id);
      setError('');

      await deleteAccount(account.id);

      setAccounts((currentAccounts) =>
        currentAccounts.filter(
          (currentAccount) => currentAccount.id !== account.id
        )
      );

      if (editingAccount?.id === account.id) {
        clearForm();
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setDeletingAccountId(null);
    }
  }

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  const formatAccountType = (accountType) => {
    const types = {
      BANK: 'Conta bancária',
      CASH: 'Dinheiro',
      INVESTMENT: 'Investimento',
      OTHER: 'Outra',
    };

    return types[accountType] || accountType;
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

              <h3>
                {editingAccount
                  ? 'Editar conta'
                  : 'Nova conta'}
              </h3>
            </div>
          </div>

          <form
            onSubmit={handleSubmitAccount}
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
                type="text"
                inputMode="decimal"
                value={initialBalance}
                onChange={(event) =>
                  setInitialBalance(
                    formatAmountInput(event.target.value)
                  )
                }
                onBlur={(event) =>
                  setInitialBalance(
                    formatAmountOnBlur(event.target.value)
                  )
                }
                placeholder="0,00"
                required
              />
            </div>

            <div className="account-form-actions">
              <button
                type="submit"
                className="account-submit-button"
                disabled={saving}
              >
                {saving
                  ? editingAccount
                    ? 'Salvando...'
                    : 'Criando...'
                  : editingAccount
                    ? 'Salvar alterações'
                    : 'Criar conta'}
              </button>

              {editingAccount && (
                <button
                  type="button"
                  className="account-cancel-button"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancelar
                </button>
              )}
            </div>
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

        {!loading && (
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
                  <span>Saldo inicial</span>

                  <strong>
                    {formatCurrency(account.initialBalance)}
                  </strong>
                </div>

                <div className="account-card-actions">
                  <button
                    type="button"
                    onClick={() =>
                      handleEditAccount(account)
                    }
                    disabled={
                      saving ||
                      deletingAccountId === account.id
                    }
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteAccount(account)
                    }
                    disabled={
                      saving ||
                      deletingAccountId === account.id
                    }
                  >
                    {deletingAccountId === account.id
                      ? 'Excluindo...'
                      : 'Excluir'}
                  </button>
                </div>
              </article>
            ))}

            {accounts.length === 0 && (
              <div className="dashboard-section">
                <div className="empty-state">
                  <h4>Nenhuma conta cadastrada</h4>

                  <p>
                    Quando você adicionar uma conta,
                    ela aparecerá aqui.
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