import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
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
import { formatDate } from '../utils/date';
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

function KpiCard({ label, value, hint, tone, loading }) {
  return (
    <Card as="article" className={`dash-kpi${tone ? ` dash-kpi--${tone}` : ''}`}>
      <span className="dash-kpi__label">{label}</span>
      {loading ? (
        <Skeleton height={32} width="70%" />
      ) : (
        <strong className="dash-kpi__value num">{value}</strong>
      )}
      <small className="dash-kpi__hint">{hint}</small>
    </Card>
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

function RecentActivity({ items }) {
  return (
    <ul className="dash-activity">
      {items.map((item) => {
        const expense = item.type === 'EXPENSE';

        return (
          <li key={item.id} className="dash-activity__item">
            <div className="dash-activity__main">
              <span className="dash-activity__title">{item.description}</span>
              <span className="dash-activity__meta">
                {formatDate(item.date)} · {item.accountName} · {item.categoryName}
              </span>
            </div>
            <span className={`dash-activity__amount num ${expense ? 'is-expense' : 'is-income'}`}>
              <span className="sr-only">{expense ? 'Despesa: ' : 'Receita: '}</span>
              {expense ? '− ' : '+ '}
              {formatCurrency(item.amount)}
            </span>
          </li>
        );
      })}
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
            <div className="dash-kpis">
              <KpiCard
                label="Saldo total"
                value={formatCurrency(data?.totalBalance)}
                hint={accountId ? 'Saldo da conta selecionada' : 'Saldo inicial + receitas − despesas, em todas as contas'}
                loading={showKpiLoading}
              />
              <KpiCard label="Receitas" value={formatCurrency(data?.income)} hint={periodLabel(period)} tone="income" loading={showKpiLoading} />
              <KpiCard label="Despesas" value={formatCurrency(expenseTotal)} hint={periodLabel(period)} tone="expense" loading={showKpiLoading} />
              <KpiCard
                label="Resultado"
                value={formatCurrency(data?.net)}
                hint="Receitas − despesas no período"
                tone={data && Number(data.net) < 0 ? 'expense' : 'income'}
                loading={showKpiLoading}
              />
            </div>

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

              <Card className="dash-panel" aria-busy={loading}>
                <CardHeader
                  title="Movimentações recentes"
                  subtitle="Receitas e despesas, da mais recente"
                  actions={<Link to="/transactions" className="dash-link">Ver todas</Link>}
                />
                {loading ? (
                  <div className="dash-activity-skeleton">
                    {[0, 1, 2, 3].map((item) => (
                      <Skeleton key={item} height={44} radius="10px" />
                    ))}
                  </div>
                ) : data.recentTransactions.length === 0 ? (
                  <p className="dash-panel__empty">Nenhuma movimentação para estes filtros.</p>
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
