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
        <a href="/" onClick={handleNavigation}>Dashboard</a>
        <a href="/accounts" onClick={handleNavigation}>Contas</a>
        <a href="/income" onClick={handleNavigation}>Receitas</a>
        <a href="/expenses" onClick={handleNavigation}>Despesas</a>
      </nav>
    </aside>
  );
}

export default Sidebar;
