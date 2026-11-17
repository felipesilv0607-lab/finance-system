import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Atalho "+ Nova movimentação" do cabeçalho: ele navega para a página com
// `state: { newEntry: true }`. Esta página, ao ver o sinal, leva o foco ao
// campo do formulário e limpa o sinal (replace), para que atualizar a página
// ou voltar no histórico não repita a ação.
export default function useFocusNewEntry(fieldId) {
  const location = useLocation();
  const navigate = useNavigate();
  const requested = Boolean(location.state?.newEntry);
  const { pathname, search } = location;

  useEffect(() => {
    if (!requested) return;

    const field = document.getElementById(fieldId);

    field?.scrollIntoView({ block: 'center' });
    field?.focus({ preventScroll: true });

    navigate(`${pathname}${search}`, { replace: true, state: null });
  }, [requested, fieldId, navigate, pathname, search]);
}
