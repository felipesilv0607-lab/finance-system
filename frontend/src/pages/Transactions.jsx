import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { formatCurrency, toAmountPayload } from '../utils/money';
import { apiDateToInputValue, formatDate, toDateInputValue } from '../utils/date';
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction
} from '../services/transactionsService';
import { getAccounts } from '../services/accountsService';
import { getCategories } from '../services/categoriesService';
import {
  formatAmountInput,
  formatAmountOnBlur,
} from '../utils/amount';

const initialForm = {
  description: '',
  amount: '',
  type: 'EXPENSE',
  date: toDateInputValue(),
  accountId: '',
  categoryId: ''
};

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

  const [reloadKey, setReloadKey] = useState(0);

  function reload() {
    setReloadKey((current) => current + 1);
  }

  useEffect(() => {
    let active = true;

    Promise.all([
      getTransactions(filterType || undefined),
      getAccounts(),
      getCategories()
    ])
      .then(([transactionsData, accountsData, categoriesData]) => {
        if (!active) return;

        setTransactions(transactionsData);
        setAccounts(accountsData);
        setCategories(categoriesData);
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filterType, reloadKey]);

  function handleFilterChange(event) {
    setLoading(true);
    setError('');
    setFilterType(event.target.value);
  }

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
      amount: formatAmountInput(String(transaction.amount)),
      type: transaction.type,
      date: apiDateToInputValue(transaction.date),
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
        amount: toAmountPayload(form.amount),
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
      reload();
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

      reload();
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
    <AppLayout
      title="Transações"
      description="Gerencie suas receitas e despesas."
    >
      <div className="page-container">

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
                  type="text"
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      amount: formatAmountInput(
                        event.target.value
                      )
                    }))
                  }
                  onBlur={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
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
                onChange={handleFilterChange}
              >
                <option value="">Todas</option>
                <option value="INCOME">
                  Receitas
                </option>
                <option value="EXPENSE">
                  Despesas
                </option>
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

                      <td>
                        {transaction.description}
                      </td>

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
                        {formatCurrency(
                          transaction.amount
                        )}
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
    </AppLayout>
  );
}

export default Transactions;
