import { useEffect, useMemo, useState } from 'react';
import AppLayout from './AppLayout';
import Button from './ui/Button';
import { Card, CardHeader } from './ui/Card';
import { ConfirmDialog } from './ui/Dialog';
import EmptyState from './ui/EmptyState';
import { Input, Select } from './ui/Field';
import Icon from './ui/Icon';
import IconButton from './ui/IconButton';
import Skeleton from './ui/Skeleton';
import { useToast } from './toast-context';
import useFocusNewEntry from '../hooks/useFocusNewEntry';
import { formatCurrency, sumAmounts, toAmountPayload } from '../utils/money';
import { apiDateToInputValue, formatDate, toDateInputValue } from '../utils/date';
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

// Tela de lançamentos de um tipo (Receitas ou Despesas). Cada página passa a
// sua configuração de config/movements.js (INCOME_PAGE ou EXPENSE_PAGE).

// Id usado pelo atalho "+ Nova movimentação" do cabeçalho (useFocusNewEntry).
const DESCRIPTION_FIELD_ID = 'description';

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function focusDescriptionField() {
  const field = document.getElementById(DESCRIPTION_FIELD_ID);

  // 'auto' = rolagem instantânea (nenhum CSS define scroll-behavior: smooth).
  field?.scrollIntoView({
    block: 'center',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
  field?.focus({ preventScroll: true });
}

function MovementRow({ page, transaction, categoryName, accountName, editing, busy, deleting, onEdit, onDelete }) {
  return (
    <li className={`mov-row mov-row--${page.tone}${editing ? ' is-editing' : ''}`}>
      <span className="mov-row__icon" aria-hidden="true">
        <Icon name={page.icon} size={18} />
      </span>

      <div className="mov-row__main">
        <span className="mov-row__title">
          <span className="mov-row__text">{transaction.description}</span>
          {editing && <span className="mov-row__editing">Em edição</span>}
        </span>
        <span className="mov-row__meta">
          <time dateTime={apiDateToInputValue(transaction.date)}>
            {formatDate(transaction.date)}
          </time>
          {' · '}{categoryName}{' · '}{accountName}
        </span>
      </div>

      <span className="mov-row__amount num">
        <span className="sr-only">{page.Noun}: </span>{page.sign} {formatCurrency(transaction.amount)}
      </span>

      <div className="mov-row__actions">
        <IconButton
          icon="edit"
          label={`Editar ${page.noun} ${transaction.description}`}
          size="sm"
          onClick={() => onEdit(transaction)}
          disabled={busy || deleting}
        />
        <IconButton
          icon="trash"
          label={`Excluir ${page.noun} ${transaction.description}`}
          size="sm"
          tone="danger"
          onClick={() => onDelete(transaction)}
          disabled={busy || deleting}
        />
      </div>
    </li>
  );
}

function MovementPage({ page }) {
  useFocusNewEntry(DESCRIPTION_FIELD_ID);

  const toast = useToast();

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: toDateInputValue(),
    accountId: '',
    categoryId: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');

  const [reloadKey, setReloadKey] = useState(0);

  function reload() {
    setReloadKey((current) => current + 1);
  }

  useEffect(() => {
    let active = true;

    Promise.all([
      getTransactions(page.type),
      getAccounts(),
      getCategories()
    ])
      .then(([transactionsData, accountsData, categoriesData]) => {
        if (!active) return;

        setTransactions(transactionsData || []);
        setAccounts(accountsData || []);
        setCategories(
          (categoriesData || []).filter((category) => category.type === page.type)
        );
        // Só um carregamento bem-sucedido encerra a falha anterior.
        setLoadError('');
      })
      .catch((err) => {
        if (active) setLoadError(err.message || `Não foi possível carregar as ${page.nounPlural}.`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey, page.type, page.nounPlural]);

  const total = useMemo(() => {
    return sumAmounts(transactions.map((transaction) => transaction.amount));
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
      date: toDateInputValue(),
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

      const transactionData = {
        description: form.description,
        amount: toAmountPayload(form.amount),
        type: page.type,
        date: form.date,
        accountId: form.accountId,
        categoryId: form.categoryId
      };

      if (editingId) {
        await updateTransaction(editingId, transactionData);
        toast.success(`${page.Noun} atualizada`, 'As alterações foram salvas.');
      } else {
        await createTransaction(transactionData);
        toast.success(`${page.Noun} criada`, `A ${page.noun} foi registrada.`);
      }

      resetForm();
      reload();
    } catch (err) {
      setError(err.message || `Não foi possível salvar a ${page.noun}.`);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(transaction) {
    setEditingId(transaction.id);

    setForm({
      description: transaction.description,
      amount: formatAmountInput(String(transaction.amount)),
      date: apiDateToInputValue(transaction.date),
      accountId: transaction.accountId,
      categoryId: transaction.categoryId
    });

    setError('');
    focusDescriptionField();
  }

  async function handleConfirmDelete() {
    const transaction = transactionToDelete;

    if (!transaction) return;

    try {
      setDeletingId(transaction.id);
      setError('');

      await deleteTransaction(transaction.id);

      if (editingId === transaction.id) {
        resetForm();
      }

      toast.success(`${page.Noun} excluída`, `"${transaction.description}" foi removida.`);
      reload();
    } catch (err) {
      toast.error(`Não foi possível excluir a ${page.noun}`, err.message);
    } finally {
      setDeletingId(null);
      setTransactionToDelete(null);
    }
  }

  function handleRetry() {
    setLoading(true);
    reload();
  }

  // Sem a listagem completa, total e contagem seriam parciais (ou zero):
  // o resumo e o histórico ficam indisponíveis até um carregamento bem-sucedido.
  const listUnavailable = Boolean(loadError);
  const count = transactions.length;
  const countLabel = count === 1 ? `${page.noun} registrada` : `${page.nounPlural} registradas`;

  return (
    <AppLayout title={page.title} description={page.description}>
      <div className="mov" aria-busy={loading}>
        <section className="mov-hero" aria-label={`Resumo das ${page.nounPlural}`}>
          <div className="mov-hero__main">
            <span className="mov-hero__label">Total de {page.nounPlural}</span>
            {loading ? (
              <Skeleton height={36} width="12rem" className="mov-hero__skeleton" />
            ) : listUnavailable ? (
              <strong className="mov-hero__value">
                <span aria-hidden="true">—</span>
                <span className="sr-only">Indisponível</span>
              </strong>
            ) : (
              <strong className="mov-hero__value num">{formatCurrency(total)}</strong>
            )}
            <span className="mov-hero__hint">
              {listUnavailable
                ? `Indisponível: não foi possível carregar as ${page.nounPlural}`
                : `Soma de todas as ${page.nounPlural} registradas`}
            </span>
          </div>

          <div className="mov-hero__stat">
            <span className="mov-hero__stat-value num">
              {loading || listUnavailable ? '—' : count}
            </span>
            <span className="mov-hero__stat-label">{countLabel}</span>
          </div>
        </section>

        <div className="mov-layout">
          <Card className={`mov-form-card${editingId ? ' is-editing' : ''}`}>
            <CardHeader
              eyebrow={editingId ? 'Edição' : 'Cadastro'}
              title={editingId ? `Editar ${page.noun}` : `Nova ${page.noun}`}
              subtitle={editingId ? 'Altere os dados e salve.' : page.formSubtitle}
              headingLevel={2}
            />

            <form className="mov-form" onSubmit={handleSubmit}>
              <Input
                id={DESCRIPTION_FIELD_ID}
                name="description"
                label="Descrição"
                type="text"
                value={form.description}
                onChange={handleChange}
                placeholder={page.placeholder}
                minLength={2}
                maxLength={200}
                required
              />

              <div className="mov-form__row">
                <Input
                  id="amount"
                  name="amount"
                  label="Valor"
                  type="text"
                  inputMode="decimal"
                  prefix="R$"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: formatAmountInput(event.target.value)
                    }))
                  }
                  onBlur={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: formatAmountOnBlur(event.target.value)
                    }))
                  }
                  placeholder="0,00"
                  required
                />

                <Input
                  id="date"
                  name="date"
                  label="Data"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <Select
                id="accountId"
                name="accountId"
                label="Conta"
                value={form.accountId}
                onChange={handleChange}
                hint={!loading && !listUnavailable && accounts.length === 0
                  ? 'Nenhuma conta cadastrada. Crie uma em Contas.'
                  : undefined}
                required
              >
                <option value="">Selecione uma conta</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>

              <Select
                id="categoryId"
                name="categoryId"
                label="Categoria"
                value={form.categoryId}
                onChange={handleChange}
                hint={!loading && !listUnavailable && categories.length === 0
                  ? page.categoryHint
                  : undefined}
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>

              {error && (
                <div className="mov-alert" role="alert">
                  <Icon name="alert-circle" size={18} />
                  <p>{error}</p>
                </div>
              )}

              <div className="mov-form__actions">
                <Button
                  type="submit"
                  icon={editingId ? 'check' : 'plus'}
                  loading={saving}
                >
                  {saving
                    ? 'Salvando...'
                    : editingId
                      ? 'Salvar alterações'
                      : `Adicionar ${page.noun}`}
                </Button>

                {editingId && (
                  <Button variant="secondary" onClick={resetForm} disabled={saving}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <Card padding="flush" className="mov-history" aria-labelledby="mov-history-title">
            <div className="mov-history__header">
              <h2 id="mov-history-title" className="mov-history__title">
                Histórico de {page.nounPlural}
              </h2>
              {!loading && !listUnavailable && (
                <span className="mov-history__count">
                  {count} {count === 1 ? page.noun : page.nounPlural}
                </span>
              )}
            </div>

            {listUnavailable && (
              <div className="mov-history__body">
                <div className="mov-alert" role="alert">
                  <Icon name="alert-circle" size={18} />
                  <p>{loadError}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon="refresh"
                    onClick={handleRetry}
                    loading={loading}
                    className="mov-alert__action"
                  >
                    Tentar novamente
                  </Button>
                </div>
              </div>
            )}

            {loading && !listUnavailable && (
              <div className="mov-history__body mov-history__skeleton">
                {[0, 1, 2, 3].map((item) => (
                  <Skeleton key={item} height={52} radius="10px" />
                ))}
              </div>
            )}

            {!loading && !listUnavailable && count === 0 && (
              <EmptyState
                icon={page.emptyIcon}
                title={`Nenhuma ${page.noun} cadastrada`}
                description={page.emptyDescription}
                action={
                  <Button variant="secondary" icon="plus" onClick={focusDescriptionField}>
                    {`Adicionar ${page.noun}`}
                  </Button>
                }
              />
            )}

            {!loading && !listUnavailable && count > 0 && (
              <ul className="mov-rows">
                {transactions.map((transaction) => {
                  const category = categories.find(
                    (item) => item.id === transaction.categoryId
                  );

                  const account = accounts.find(
                    (item) => item.id === transaction.accountId
                  );

                  return (
                    <MovementRow
                      key={transaction.id}
                      page={page}
                      transaction={transaction}
                      categoryName={category?.name || 'Categoria não encontrada'}
                      accountName={account?.name || 'Conta não encontrada'}
                      editing={editingId === transaction.id}
                      busy={saving}
                      deleting={deletingId === transaction.id}
                      onEdit={handleEdit}
                      onDelete={setTransactionToDelete}
                    />
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={transactionToDelete !== null}
        title={`Excluir ${page.noun}?`}
        description={
          transactionToDelete
            ? `Tem certeza que deseja excluir a ${page.noun} "${transactionToDelete.description}" de ${formatCurrency(transactionToDelete.amount)}? Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel={`Excluir ${page.noun}`}
        loading={deletingId !== null}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTransactionToDelete(null)}
      />
    </AppLayout>
  );
}

export default MovementPage;
