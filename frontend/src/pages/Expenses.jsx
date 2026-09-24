import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction
} from '../services/transactionsService';
import { getAccounts } from '../services/accountsService';
import { getCategories } from '../services/categoriesService';
import {
  formatAmountInput,
  formatAmountOnBlur,
} from '../utils/amount';

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatDate(date) {
  const datePart = String(date).slice(0, 10);

  return new Date(`${datePart}T00:00:00`).toLocaleDateString('pt-BR');
}

function Expenses() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: getToday(),
    accountId: '',
    categoryId: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [transactionsData, accountsData, categoriesData] =
        await Promise.all([
          getTransactions('EXPENSE'),
          getAccounts(),
          getCategories()
        ]);

      setTransactions(transactionsData || []);
      setAccounts(accountsData || []);

      setCategories(
        (categoriesData || []).filter(
          (category) => category.type === 'EXPENSE'
        )
      );
    } catch (err) {
      setError(err.message || 'Não foi possível carregar as despesas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalExpenses = useMemo(() => {
    return transactions.reduce(
      (total, transaction) => total + Number(transaction.amount),
      0
    );
  }, [transactions]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function resetForm() {
    setForm({
      description: '',
      amount: '',
      date: getToday(),
      accountId: '',
      categoryId: ''
    });

    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const transactionData = {
        description: form.description,
        amount: Number(form.amount),
        type: 'EXPENSE',
        date: form.date,
        accountId: form.accountId,
        categoryId: form.categoryId
      };

      if (editingId) {
        await updateTransaction(editingId, transactionData);
        setSuccess('Despesa atualizada com sucesso.');
      } else {
        await createTransaction(transactionData);
        setSuccess('Despesa criada com sucesso.');
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível salvar a despesa.');
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(transaction) {
    setEditingId(transaction.id);

    setForm({
      description: transaction.description,
      amount: formatAmountInput(String(transaction.amount)),
      date: transaction.date?.slice(0, 10),
      accountId: transaction.accountId,
      categoryId: transaction.categoryId
    });

    setError('');
    setSuccess('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta despesa?'
    );

    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');

      await deleteTransaction(id);

      if (editingId === id) {
        resetForm();
      }

      setSuccess('Despesa excluída com sucesso.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Não foi possível excluir a despesa.');
    }
  }

  return (
    <AppLayout title="Despesas" section="FINANÇAS">
      <div className="page-container">
        <div>
          <h2>Despesas</h2>
          <p>Gerencie seus gastos e saídas de dinheiro.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div>
            <h3>
              {editingId ? 'Editar despesa' : 'Nova despesa'}
            </h3>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="description">
                Descrição
              </label>

              <input
                id="description"
                name="description"
                type="text"
                value={form.description}
                onChange={handleChange}
                placeholder="Ex.: Supermercado"
                minLength={2}
                maxLength={200}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">
                Valor
              </label>

              <input
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: formatAmountInput(
                      event.target.value
                    )
                  }))
                }
                onBlur={(event) =>
                  setForm((current) => ({
                    ...current,
                    amount: formatAmountOnBlur(
                      event.target.value
                    )
                  }))
                }
                placeholder="0,00"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="date">
                Data
              </label>

              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="accountId">
                Conta
              </label>

              <select
                id="accountId"
                name="accountId"
                value={form.accountId}
                onChange={handleChange}
                required
              >
                <option value="">
                  Selecione uma conta
                </option>

                {accounts.map((account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="categoryId">
                Categoria
              </label>

              <select
                id="categoryId"
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                required
              >
                <option value="">
                  Selecione uma categoria
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving
                ? 'Salvando...'
                : editingId
                  ? 'Salvar alterações'
                  : 'Adicionar despesa'}
            </button>

            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Resumo</h3>
            <p>
              Total de despesas: {transactions.length}
            </p>
          </div>

          <strong>{formatCurrency(totalExpenses)}</strong>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3>Histórico de despesas</h3>

            <p>
              {transactions.length}{' '}
              {transactions.length === 1
                ? 'despesa'
                : 'despesas'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            Carregando despesas...
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            Nenhuma despesa cadastrada.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Conta</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => {
                  const category = categories.find(
                    (item) =>
                      item.id === transaction.categoryId
                  );

                  const account = accounts.find(
                    (item) =>
                      item.id === transaction.accountId
                  );

                  return (
                    <tr key={transaction.id}>
                      <td>
                        {formatDate(transaction.date)}
                      </td>

                      <td>
                        {transaction.description}
                      </td>

                      <td>
                        {category?.name ||
                          'Categoria não encontrada'}
                      </td>

                      <td>
                        {account?.name ||
                          'Conta não encontrada'}
                      </td>

                      <td className="transaction-type-expense">
                        {formatCurrency(transaction.amount)}
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() =>
                              handleEdit(transaction)
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="btn-danger"
                            onClick={() =>
                              handleDelete(transaction.id)
                            }
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Expenses;