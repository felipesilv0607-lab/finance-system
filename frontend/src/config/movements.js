// Configuração das telas de lançamentos (components/MovementPage.jsx).
// Receitas e Despesas têm o mesmo comportamento; muda só o tipo enviado à API,
// os textos e o tom visual.

export const INCOME_PAGE = {
  type: 'INCOME',
  title: 'Receitas',
  description: 'Gerencie suas entradas de dinheiro.',
  noun: 'receita',
  nounPlural: 'receitas',
  Noun: 'Receita',
  placeholder: 'Ex.: Salário',
  formSubtitle: 'Registre uma entrada de dinheiro.',
  emptyDescription: 'Registre sua primeira entrada de dinheiro para acompanhar o total aqui.',
  categoryHint: 'Nenhuma categoria de receita. Crie uma em Categorias.',
  tone: 'income',
  icon: 'arrow-down-left',
  emptyIcon: 'trending-up',
  sign: '+',
};

export const EXPENSE_PAGE = {
  type: 'EXPENSE',
  title: 'Despesas',
  description: 'Gerencie seus gastos e saídas de dinheiro.',
  noun: 'despesa',
  nounPlural: 'despesas',
  Noun: 'Despesa',
  placeholder: 'Ex.: Supermercado',
  formSubtitle: 'Registre um gasto ou saída de dinheiro.',
  emptyDescription: 'Registre seu primeiro gasto para acompanhar o total aqui.',
  categoryHint: 'Nenhuma categoria de despesa. Crie uma em Categorias.',
  tone: 'expense',
  icon: 'arrow-up-right',
  emptyIcon: 'trending-down',
  sign: '−',
};
