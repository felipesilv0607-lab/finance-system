import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/authService';

function Header({ title = 'Dashboard', section = 'VISÃO GERAL', onMenuClick }) {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const displayName = user?.name || 'Usuário';

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

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
        <span className="header-user-name">{displayName}</span>
        <div className="header-avatar" aria-hidden="true">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <button type="button" className="header-logout" onClick={handleLogout}>
          Sair
        </button>
      </div>
    </header>
  );
}

export default Header;
