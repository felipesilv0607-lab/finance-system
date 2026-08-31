function Header({ title = 'Dashboard', section = 'VISÃO GERAL', onMenuClick }) {
  return (
    <header className="header">
      <div className="header-left">
        <button
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Abrir menu"
        >
          ☰
        </button>

        <div>
          <span className="header-label">{section}</span>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="header-user">
        <span className="header-user-name">Felipe</span>
        <div className="header-avatar">F</div>
      </div>
    </header>
  );
}

export default Header;
