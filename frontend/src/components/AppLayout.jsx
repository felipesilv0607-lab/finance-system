import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { getNavigationGroupLabel } from '../config/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import Drawer from './ui/Drawer';

// Largura a partir da qual o menu fica fixo ao lado (abaixo disso vira Drawer).
const DESKTOP_QUERY = '(min-width: 1025px)';

// Casca de todas as páginas autenticadas. Cada página passa `title` (único
// <h1>, no cabeçalho), `section` (opcional: por padrão vem do grupo do menu) e `description`
// (frase de apoio no topo do conteúdo).
function AppLayout({ children, title = 'Dashboard', section, description }) {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mainRef = useRef(null);
  // Fixado na montagem: chegar por link/redirecionamento move o foco para o
  // conteúdo; carregar a página direto (POP) não. Não reage a navegações
  // posteriores, senão atalhos que fazem `navigate(replace)` perderiam o foco.
  const [mountNavigationType] = useState(useNavigationType());

  useEffect(() => {
    if (mountNavigationType !== 'POP') mainRef.current?.focus({ preventScroll: true });
  }, [mountNavigationType]);

  // Se a janela crescer com a gaveta aberta, ela não faz mais sentido.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);

    function handleChange(event) {
      if (event.matches) setDrawerOpen(false);
    }

    query.addEventListener('change', handleChange);

    return () => query.removeEventListener('change', handleChange);
  }, []);

  function handleSkipLink(event) {
    event.preventDefault();
    mainRef.current?.focus();
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={handleSkipLink}>
        Pular para o conteúdo
      </a>

      <aside className="app-sidebar">
        <Sidebar />
      </aside>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} label="Menu">
        <Sidebar onNavigate={() => setDrawerOpen(false)} />
      </Drawer>

      <div className="app-main">
        <Header
          title={title}
          section={section ?? getNavigationGroupLabel(pathname)}
          onMenuClick={() => setDrawerOpen(true)} />

        <main id="main-content" ref={mainRef} tabIndex={-1} className="app-content">
          <div className="page">
            {description && <p className="page-description">{description}</p>}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
