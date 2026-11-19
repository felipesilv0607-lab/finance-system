import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import MovementRow from '../components/MovementRow';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardHeader } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { Select } from '../components/ui/Field';
import Skeleton from '../components/ui/Skeleton';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import CategoryDonut from '../components/charts/CategoryDonut';
import { useDashboardOverview } from '../hooks/useDashboardOverview';
import { getAccounts } from '../services/accountsService';
import { getCategories } from '../services/categoriesService';
import { formatCurrency } from '../utils/money';
import { DEFAULT_PERIOD, PERIOD_OPTIONS, periodLabel, periodRange } from '../utils/period';

const FLOW_SERIES = [
  { key: 'income', label: 'Receitas', color: 'var(--color-success-700)' },
  { key: 'expense', label: 'Despesas', color: 'var(--color-danger-500)' }
];
const BALANCE_SERIES = [{ key: 'balance', label: 'Saldo', color: 'var(--color-primary-600)' }];

function useFilterOptions() {
  const [options, setOptions] = useState({ accounts: [], categories: [] });

  useEffect(() => {
    let active = true;

    Promise.all([getAccounts(), getCategories()])
      .then(([accounts, categories]) => {
        if (active) setOptions({ accounts, categories });
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, []);

  return options;
}

// Indicador do período dentro do resumo (Receitas, Despesas, Resultado).
function HeroStat({ label, value, hint, tone, loading }) {
  return (
    <div className={`mov-hero__stat dash-stat${tone ? ` dash-stat--${tone}` : ''}`}>
      <span className="mov-hero__stat-label">{label}</span>
      <strong className="mov-hero__stat-value num">
        {loading ? <span aria-hidden="true">—</span> : value}
        {loading && <span className="sr-only">Carregando</span>}
      </strong>
      <span className="mov-hero__stat-label dash-stat__hint">{hint}</span>
    </div>
  );
}

function ChartCard({ title, subtitle, loading, empty, emptyText, children }) {
  return (
    <Card className="dash-panel" aria-busy={loading}>
      <CardHeader title={title} subtitle={subtitle} headingLevel={2} />
      {loading ? (
        <Skeleton height={220} radius="12px" />
      ) : empty ? (
        <p className="dash-panel__empty">{emptyText}</p>
      ) : (
        children
      )}
    </Card>
  );
}

// Movimentações recentes: a mesma linha do histórico de Receitas/Despesas,
// sem ações (data no dia gravado, tom e sinal pelo tipo).
function RecentActivity({ items }) {
  return (
    <ul className="mov-rows">
      {items.map((item) => (
        <MovementRow
          key={item.id}
          transaction={item}
          categoryName={item.categoryName}
          accountName={item.accountName}
        />
      ))}
    </ul>
  );
}

function Dashboard() {
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const { accounts, categories } = useFilterOptions();

  // Recalcula o intervalo só quando o período muda (e não a cada render).
  const [range, setRange] = useState(() => periodRange(DEFAULT_PERIOD));
  const { data, error, loading, reload } = useDashboardOverview({
    ...range,
    accountId,
    categoryId
  });

  const changePeriod = (value) => {
    setPeriod(value);
    setRange(periodRange(value));
  };

  const hasFilters = accountId !== '' || categoryId !== '';
  const clearFilters = () => {
    setAccountId('');
    setCategoryId('');
  };

  const noPeriodData =
    data && data.series.every((point) => Number(point.income) === 0 && Number(point.expense) === 0);
  const noActivityAtAll = data && noPeriodData && data.recentTransactions.length === 0 && !hasFilters;
  const showKpiLoading = loading && !error;
  const expenseTotal = data?.expense;

  return (
    <AppLayout
      title="Dashboard"
      description="Acompanhe suas contas, receitas e despesas em um só lugar."
    >
      <div className="dash" aria-busy={loading}>
        <Card padding="sm" className="dash-filters-card">
          <form className="dash-filters" aria-label="Filtros do Dashboard" onSubmit={(event) => event.preventDefault()}>
            <Select label="Período" value={period} onChange={(event) => changePeriod(event.target.value)}>
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>

            <Select label="Conta" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
              <option value="">Todas as contas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </Select>

            <Select label="Categoria" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.type === 'INCOME' ? 'receita' : 'despesa'})
                </option>
              ))}
            </Select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="dash-filters__clear">
                Limpar filtros
              </Button>
            )}
          </form>
        </Card>

        {error && (
          <div className="dash-error" role="alert">
            <p>Não foi possível carregar o Dashboard. Verifique sua conexão e tente novamente.</p>
            <Button variant="secondary" size="sm" icon="refresh" onClick={reload}>
              Tentar novamente
            </Button>
          </div>
        )}

        {!error && noActivityAtAll && (
          <Card>
            <EmptyState
              icon="transactions"
              title="Nenhuma movimentação ainda"
              description="Registre suas primeiras receitas e despesas para ver indicadores e gráficos aqui."
              action={<Link to="/income" className="ui-btn ui-btn--primary">Nova receita</Link>}
            />
          </Card>
        )}

        {!error && !noActivityAtAll && (
          <>
            <section className="mov-hero dash-hero" aria-label="Resumo financeiro">
              <div className="mov-hero__main">
                <span className="mov-hero__label">Saldo total</span>
                {showKpiLoading ? (
                  <Skeleton height={36} width="12rem" className="mov-hero__skeleton" />
                ) : (
                  <strong className="mov-hero__value num">{formatCurrency(data?.totalBalance)}</strong>
                )}
                <span className="mov-hero__hint">
                  {accountId ? 'Saldo da conta selecionada' : 'Saldo inicial + receitas − despesas, em todas as contas'}
                </span>
              </div>

              <div className="mov-hero__stats">
                <HeroStat label="Receitas" value={formatCurrency(data?.income)} hint={periodLabel(period)} tone="income" loading={showKpiLoading} />
                <HeroStat label="Despesas" value={formatCurrency(expenseTotal)} hint={periodLabel(period)} tone="expense" loading={showKpiLoading} />
                <HeroStat
                  label="Resultado"
                  value={formatCurrency(data?.net)}
                  hint="Receitas − despesas no período"
                  tone={data && Number(data.net) < 0 ? 'expense' : 'income'}
                  loading={showKpiLoading}
                />
              </div>
            </section>

            <div className="dash-grid">
              <ChartCard
                title="Receitas e despesas"
                subtitle={data?.granularity === 'month' ? 'Totais por mês' : 'Totais por dia'}
                loading={loading}
                empty={noPeriodData}
                emptyText="Sem receitas ou despesas neste período e filtros."
              >
                {data && (
                  <TimeSeriesChart
                    variant="bars"
                    points={data.series}
                    series={FLOW_SERIES}
                    granularity={data.granularity}
                    title="Receitas e despesas no período"
                    description={`Receitas ${formatCurrency(data.income)} e despesas ${formatCurrency(data.expense)} em ${data.series.length} ${data.granularity === 'month' ? 'meses' : 'dias'}.`}
                  />
                )}
              </ChartCard>

              <ChartCard
                title="Evolução do saldo"
                subtitle={categoryId ? 'Saldo das contas (não muda com a categoria)' : 'Saldo acumulado ao fim de cada período'}
                loading={loading}
                empty={noPeriodData}
                emptyText="Sem movimentações para traçar a evolução do saldo."
              >
                {data && (
                  <TimeSeriesChart
                    variant="line"
                    points={data.series}
                    series={BALANCE_SERIES}
                    granularity={data.granularity}
                    title="Evolução do saldo"
                    description={`Saldo de ${formatCurrency(data.series[0].balance)} a ${formatCurrency(data.series.at(-1).balance)} no período.`}
                  />
                )}
              </ChartCard>

              <ChartCard
                title="Despesas por categoria"
                subtitle={periodLabel(period)}
                loading={loading}
                empty={data && data.expensesByCategory.length === 0}
                emptyText="Nenhuma despesa neste período e filtros."
              >
                {data && <CategoryDonut items={data.expensesByCategory} total={data.expense} />}
              </ChartCard>

              <Card padding="flush" className="mov-history dash-recent" aria-busy={loading} aria-labelledby="dash-recent-title">
                <div className="mov-history__header">
                  <div>
                    <h2 id="dash-recent-title" className="mov-history__title">Movimentações recentes</h2>
                    <p className="dash-recent__subtitle">Receitas e despesas, da mais recente</p>
                  </div>
                  <Link to="/transactions" className="dash-link">Ver todas</Link>
                </div>
                {loading ? (
                  <div className="mov-history__body mov-history__skeleton">
                    {[0, 1, 2, 3].map((item) => (
                      <Skeleton key={item} height={52} radius="10px" />
                    ))}
                  </div>
                ) : data.recentTransactions.length === 0 ? (
                  <p className="mov-history__body dash-panel__empty">Nenhuma movimentação para estes filtros.</p>
                ) : (
                  <RecentActivity items={data.recentTransactions} />
                )}
              </Card>
            </div>

            {hasFilters && !loading && (
              <p className="dash-note">
                <Badge tone="info">Filtros ativos</Badge> Os gráficos e a lista refletem a conta e a categoria escolhidas.
              </p>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default Dashboard;
