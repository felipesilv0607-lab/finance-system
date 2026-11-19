import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/Dialog';
import EmptyState from '../components/ui/EmptyState';
import { Input, Select } from '../components/ui/Field';
import Icon from '../components/ui/Icon';
import IconButton from '../components/ui/IconButton';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/toast-context';
import { formatCurrency, sumAmounts, toAmountPayload } from '../utils/money';
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

// Rótulo, ícone e tom visual de cada tipo de conta.
const ACCOUNT_TYPES = {
  BANK: { label: 'Conta bancária', icon: 'bank', tone: 'primary' },
  CASH: { label: 'Dinheiro', icon: 'cash', tone: 'success' },
  INVESTMENT: { label: 'Investimento', icon: 'chart-line', tone: 'info' },
  OTHER: { label: 'Outra', icon: 'wallet', tone: 'neutral' },
};

const NAME_FIELD_ID = 'account-name';

function getAccountType(accountType) {
  return (
    ACCOUNT_TYPES[accountType] || {
      label: accountType,
      icon: 'wallet',
      tone: 'neutral',
    }
  );
}

function isNegative(value) {
  return String(value ?? '').trim().startsWith('-');
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function focusNameField() {
  const field = document.getElementById(NAME_FIELD_ID);

  // 'auto' = rolagem instantânea (nenhum CSS define scroll-behavior: smooth).
  field?.scrollIntoView({
    block: 'center',
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
  field?.focus({ preventScroll: true });
}

function AccountCard({ account, editing, busy, deleting, onEdit, onDelete }) {
  const type = getAccountType(account.type);
  const negative = isNegative(account.balance);

  return (
    <Card
      as="article"
      interactive
      className={`acc-card${editing ? ' is-editing' : ''}`}
      aria-label={account.name}
    >
      <div className="acc-card__top">
        <span className={`acc-card__icon acc-tone--${type.tone}`} aria-hidden="true">
          <Icon name={type.icon} size={22} />
        </span>

        <div className="acc-card__identity">
          <h3 className="acc-card__name">{account.name}</h3>
          <Badge tone={type.tone}>{type.label}</Badge>
        </div>

        <div className="acc-card__actions">
          <IconButton
            icon="edit"
            label={`Editar conta ${account.name}`}
            size="sm"
            onClick={() => onEdit(account)}
            disabled={busy || deleting}
          />
          <IconButton
            icon="trash"
            label={`Excluir conta ${account.name}`}
            size="sm"
            tone="danger"
            onClick={() => onDelete(account)}
            disabled={busy || deleting}
          />
        </div>
      </div>

      <div className="acc-card__balance">
        <span className="acc-card__label">Saldo atual</span>
        <strong className={`acc-card__value num${negative ? ' is-negative' : ''}`}>
          {formatCurrency(account.balance)}
        </strong>
      </div>

      <div className="acc-card__footer">
        <span>Saldo inicial</span>
        <span className="num">{formatCurrency(account.initialBalance)}</span>
      </div>

      {editing && (
        <span className="acc-card__editing">
          <Icon name="edit" size={14} /> Em edição
        </span>
      )}
    </Card>
  );
}

function Accounts() {
  const toast = useToast();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  const [editingAccount, setEditingAccount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState(null);
  const [accountToDelete, setAccountToDelete] = useState(null);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const data = await getAccounts();
        setAccounts(data);
      } catch (err) {
        console.error(err);
        setLoadError('Não foi possível carregar as contas.');
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
        initialBalance: toAmountPayload(initialBalance),
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

        toast.success('Conta atualizada', `"${updatedAccount.name}" foi salva.`);
      } else {
        const newAccount = await createAccount(accountData);

        setAccounts((currentAccounts) => [
          ...currentAccounts,
          newAccount,
        ]);

        toast.success(
          'Conta criada',
          loadError
            ? `"${newAccount.name}" foi salva. Recarregue a página para ver a lista completa.`
            : `"${newAccount.name}" já aparece na lista.`
        );
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
    focusNameField();
  }

  function handleCancelEdit() {
    clearForm();
    setError('');
  }

  async function handleConfirmDelete() {
    const account = accountToDelete;

    if (!account) {
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

      toast.success('Conta excluída', `"${account.name}" foi removida.`);
    } catch (err) {
      console.error(err);
      // Ex.: conta com movimentações (409). O aviso aparece junto da ação,
      // e não no formulário, que pode estar sendo usado para outra conta.
      toast.error('Não foi possível excluir a conta', err.message);
    } finally {
      setDeletingAccountId(null);
      setAccountToDelete(null);
    }
  }

  const totalBalance = sumAmounts(accounts.map((account) => account.balance));
  const accountCount = accounts.length;
  // Sem a listagem completa, total e contagem seriam parciais (ou zero):
  // o resumo e a lista ficam indisponíveis até um carregamento bem-sucedido.
  const listUnavailable = Boolean(loadError);

  return (
    <AppLayout
      title="Contas"
      description="Visualize e acompanhe o saldo das suas contas."
    >
      <div className="acc" aria-busy={loading}>
        <section className="acc-hero" aria-label="Resumo das contas">
          <div className="acc-hero__main">
            <span className="acc-hero__label">Patrimônio em contas</span>
            {loading ? (
              <Skeleton height={36} width="12rem" className="acc-hero__skeleton" />
            ) : listUnavailable ? (
              <strong className="acc-hero__value">
                <span aria-hidden="true">—</span>
                <span className="sr-only">Indisponível</span>
              </strong>
            ) : (
              <strong className={`acc-hero__value num${isNegative(totalBalance) ? ' is-negative' : ''}`}>
                {formatCurrency(totalBalance)}
              </strong>
            )}
            <span className="acc-hero__hint">
              {listUnavailable
                ? 'Indisponível: não foi possível carregar as contas'
                : 'Soma dos saldos atuais de todas as contas'}
            </span>
          </div>

          <div className="acc-hero__stat">
            <span className="acc-hero__stat-value num">
              {loading || listUnavailable ? '—' : accountCount}
            </span>
            <span className="acc-hero__stat-label">
              {accountCount === 1 ? 'conta cadastrada' : 'contas cadastradas'}
            </span>
          </div>
        </section>

        <div className="acc-layout">
          <Card className={`acc-form-card${editingAccount ? ' is-editing' : ''}`}>
            <CardHeader
              eyebrow="Cadastro"
              title={editingAccount ? 'Editar conta' : 'Nova conta'}
              subtitle={
                editingAccount
                  ? `Alterando "${editingAccount.name}".`
                  : 'Cadastre bancos, carteiras e investimentos.'
              }
              headingLevel={2}
            />

            <form onSubmit={handleSubmitAccount} className="acc-form">
              <Input
                id={NAME_FIELD_ID}
                label="Nome da conta"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Nubank"
                required
              />

              <Select
                id="account-type"
                label="Tipo de conta"
                value={type}
                onChange={(event) => setType(event.target.value)}
                required
              >
                <option value="">Selecione o tipo</option>
                <option value="BANK">Conta bancária</option>
                <option value="CASH">Dinheiro</option>
                <option value="INVESTMENT">Investimento</option>
                <option value="OTHER">Outra</option>
              </Select>

              <Input
                id="account-balance"
                label="Saldo inicial"
                type="text"
                inputMode="decimal"
                prefix="R$"
                value={initialBalance}
                onChange={(event) =>
                  setInitialBalance(formatAmountInput(event.target.value))
                }
                onBlur={(event) =>
                  setInitialBalance(formatAmountOnBlur(event.target.value))
                }
                placeholder="0,00"
                required
              />

              {error && (
                <div className="acc-alert" role="alert">
                  <Icon name="alert-circle" size={18} />
                  <p>{error}</p>
                </div>
              )}

              <div className="acc-form__actions">
                <Button
                  type="submit"
                  icon={editingAccount ? 'check' : 'plus'}
                  loading={saving}
                >
                  {saving
                    ? editingAccount
                      ? 'Salvando...'
                      : 'Criando...'
                    : editingAccount
                      ? 'Salvar alterações'
                      : 'Criar conta'}
                </Button>

                {editingAccount && (
                  <Button
                    variant="secondary"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <section className="acc-list" aria-labelledby="acc-list-title">
            <div className="acc-list__header">
              <h2 id="acc-list-title" className="acc-list__title">Suas contas</h2>
              {!loading && !listUnavailable && accountCount > 0 && (
                <span className="acc-list__count">{accountCount}</span>
              )}
            </div>

            {loadError && (
              <div className="acc-alert" role="alert">
                <Icon name="alert-circle" size={18} />
                <p>{loadError}</p>
              </div>
            )}

            {loading && (
              <div className="acc-grid">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} height={176} radius="16px" />
                ))}
              </div>
            )}

            {!loading && !loadError && accountCount === 0 && (
              <Card>
                <EmptyState
                  icon="wallet"
                  title="Nenhuma conta cadastrada"
                  description="Cadastre sua primeira conta para acompanhar saldos e registrar movimentações."
                  action={
                    <Button variant="secondary" icon="plus" onClick={focusNameField}>
                      Cadastrar conta
                    </Button>
                  }
                />
              </Card>
            )}

            {!loading && !listUnavailable && accountCount > 0 && (
              <div className="acc-grid">
                {accounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    editing={editingAccount?.id === account.id}
                    busy={saving}
                    deleting={deletingAccountId === account.id}
                    onEdit={handleEditAccount}
                    onDelete={setAccountToDelete}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={accountToDelete !== null}
        title="Excluir conta?"
        description={
          accountToDelete
            ? `Tem certeza que deseja excluir a conta "${accountToDelete.name}"? Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir conta"
        loading={deletingAccountId !== null}
        onConfirm={handleConfirmDelete}
        onCancel={() => setAccountToDelete(null)}
      />
    </AppLayout>
  );
}

export default Accounts;
