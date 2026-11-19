// Fonte única da navegação: Sidebar, atalhos do cabeçalho e testes leem daqui.
// Para criar uma página nova, basta registrar a rota em App.jsx e listá-la aqui.

export const navigationGroups = [
  {
    id: 'overview',
    label: 'Visão geral',
    items: [{ to: '/', label: 'Dashboard', icon: 'dashboard', end: true }],
  },
  {
    id: 'movements',
    label: 'Movimentações',
    items: [
      { to: '/transactions', label: 'Transações', icon: 'transactions' },
      { to: '/income', label: 'Receitas', icon: 'trending-up' },
      { to: '/expenses', label: 'Despesas', icon: 'trending-down' },
    ],
  },
  {
    id: 'registers',
    label: 'Cadastros',
    items: [
      { to: '/accounts', label: 'Contas', icon: 'wallet' },
      { to: '/categories', label: 'Categorias', icon: 'tag' },
    ],
  },
];

// Atalhos "+ Nova movimentação": cada um leva ao formulário que já existe na
// página (o foco vai para o campo `fieldId` via useFocusNewEntry).
export const newEntryActions = [
  { to: '/income', label: 'Nova receita', icon: 'arrow-down-left', fieldId: 'description' },
  { to: '/expenses', label: 'Nova despesa', icon: 'arrow-up-right', fieldId: 'description' },
];

export const allNavigationItems = navigationGroups.flatMap((group) => group.items);

// Rótulo do grupo a que a rota pertence (mostrado acima do título da página).
export function getNavigationGroupLabel(pathname) {
  const group = navigationGroups.find((candidate) =>
    candidate.items.some((item) => item.to === pathname)
  );

  return group?.label;
}
