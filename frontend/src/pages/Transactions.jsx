import { useEffect, useState } from 'react';
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction
} from '../services/transactionsService';
import { getAccounts } from '../services/accountsService';
import { getCategories } from '../services/categoriesService';

const initialForm = {
  description: '',
  amount: '',
  type: 'EXPENSE',
  date: new Date().toISOString().split('T')[0],
  accountId: '',
  categoryId: ''
};

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('pt-BR');
}

function getErrorMessage(error) {
  if (error?.details) {
    const firstError = Object.values(error.details)[0];

    if (firstError) {
      return firstError;
    }
  }

  return error?.message || 'Ocorreu um erro. Tente novamente.';
}

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const [filterType, setFilterType] = useState('');

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
          getTransactions(filterType || undefined),
          getAccounts(),
          getCategories()
        ]);

      setTransactions(transactionsData);
      setAccounts(accountsData);
      setCategories(categoriesData);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [filterType]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }));

    setError('');
    setSuccess('');
  }

  function resetForm() {
    setForm({
      ...initialForm,
      type: form.type
    });

    setEditingId(null);
  }

  function handleTypeChange(event) {
    const type = event.target.value;

    setForm((currentForm) => ({
      ...currentForm,
      type,
      categoryId: ''
    }));

    setError('');
    setSuccess('');
  }

  function handleEdit(transaction) {
    setEditingId(transaction.id);

    setForm({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      date: new Date(transaction.date)
        .toISOString()
        .split('T')[0],
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

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        description: form.description.trim(),
        amount: Number(form.amount),
        type: form.type,
        date: new Date(`${form.date}T12:00:00`).toISOString(),
        accountId: form.accountId,
        categoryId: form.categoryId
      };

      if (editingId) {
        await updateTransaction(editingId, payload);
        setSuccess('Transação atualizada com sucesso.');
      } else {
        await createTransaction(payload);
        setSuccess('Transação criada com sucesso.');
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta transação?'
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await deleteTransaction(id);

      setSuccess('Transação excluída com sucesso.');

      if (editingId === id) {
        resetForm();
      }

      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  const filteredCategories = categories.filter(
    (category) => category.type === form.type
  );

  function getAccountName(accountId) {
    const account = accounts.find(
      (item) => item.id === accountId
    );

    return account?.name || 'Conta não encontrada';
  }

  function getCategoryName(categoryId) {
    const category = categories.find(
      (item) => item.id === categoryId
    );

    return category?.name || 'Categoria não encontrada';
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Transações</h1>
          <p>Gerencie suas receitas e despesas.</p>
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

      <section className="card">
        <div className="card-header">
          <h2>
            {editingId
              ? 'Editar transação'
              : 'Nova transação'}
          </h2>
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
                placeholder="Ex.: Salário"
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
                type="number"
                value={form.amount}
                onChange={handleChange}
                placeholder="0,00"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">
                Tipo
              </label>

              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleTypeChange}
                required
              >
                <option value="EXPENSE">
                  Despesa
                </option>
                <option value="INCOME">
                  Receita
                </option>
              </select>
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

                {filteredCategories.map((category) => (
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
              disabled={saving}
              className="btn-primary"
            >
              {saving
                ? 'Salvando...'
                : editingId
                  ? 'Atualizar transação'
                  : 'Adicionar transação'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-header transactions-list-header">
          <div>
            <h2>Histórico</h2>
            <p>
              {transactions.length}{' '}
              {transactions.length === 1
                ? 'transação'
                : 'transações'}
            </p>
          </div>

          <div className="filter-group">
            <label htmlFor="filterType">
              Filtrar
            </label>

            <select
              id="filterType"
              value={filterType}
              onChange={(event) =>
                setFilterType(event.target.value)
              }
            >
              <option value="">Todas</option>
              <option value="INCOME">Receitas</option>
              <option value="EXPENSE">Despesas</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Carregando transações...</p>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma transação encontrada.</p>
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
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      {formatDate(transaction.date)}
                    </td>

                    <td>{transaction.description}</td>

                    <td>
                      {getCategoryName(
                        transaction.categoryId
                      )}
                    </td>

                    <td>
                      {getAccountName(
                        transaction.accountId
                      )}
                    </td>

                    <td>
                      {transaction.type === 'INCOME'
                        ? 'Receita'
                        : 'Despesa'}
                    </td>

                    <td>
                      {formatCurrency(transaction.amount)}
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(transaction)
                          }
                          className="btn-secondary"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(transaction.id)
                          }
                          className="btn-danger"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Transactions;