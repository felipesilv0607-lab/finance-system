// Regras de teclado do Popover (padrão "disclosure"), isoladas para teste.
// ESC fecha e devolve o foco ao gatilho. Tab percorre o conteúdo naturalmente
// (sem trap): depois dele, o Popover confere onde o foco foi parar.
export function getPopoverAction({ key, open }) {
  if (!open) return null;
  if (key === 'Escape') return 'close-and-focus-trigger';
  if (key === 'Tab') return 'check-focus';

  return null;
}

// Depois de um Tab: o foco saiu do popover? Vale também quando ele foi para o
// <body> (fim da página, barra do navegador), caso em que não há relatedTarget.
export function hasFocusLeft({ activeElement, container, body }) {
  if (!container) return false;
  if (!activeElement || activeElement === body) return true;

  return !container.contains(activeElement);
}

// Fechar ao sair do componente com Tab: só quando o foco foi para um
// elemento que existe e fica fora do popover (relatedTarget nulo = clique
// em área não focável ou janela perdendo foco, que não deve fechar).
export function shouldCloseOnFocusOut({ open, relatedTarget, container }) {
  if (!open || !relatedTarget || !container) return false;

  return !container.contains(relatedTarget);
}
