import { Link } from 'react-router-dom';

function Sidebar({ isOpen, onClose }) {
  function handleNavigation() {
    if (onClose) {
      onClose();
    }
  }

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-logo">
        <h2>Finance System</h2>
      </div>

      <nav className="sidebar-nav">
        <Link to="/" onClick={handleNavigation}>
          Dashboard
        </Link>

        <Link to="/accounts" onClick={handleNavigation}>
          Contas
        </Link>

        <Link to="/categories" onClick={handleNavigation}>
          Categorias
        </Link>

        <Link to="/transactions" onClick={handleNavigation}>
          Transações
        </Link>

        <Link to="/income" onClick={handleNavigation}>
          Receitas
        </Link>

        <Link to="/expenses" onClick={handleNavigation}>
          Despesas
        </Link>
      </nav>
    </aside>
  );
}

export default Sidebar;
