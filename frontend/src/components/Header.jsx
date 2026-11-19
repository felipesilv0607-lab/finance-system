import { useNavigate } from 'react-router-dom';
import { newEntryActions } from '../config/navigation';
import { getCurrentUser, logout } from '../services/authService';
import Avatar from './ui/Avatar';
import Icon from './ui/Icon';
import IconButton from './ui/IconButton';
import Popover from './ui/Popover';

// Cabeçalho fixo no topo da área de conteúdo: menu (tablet/celular), título
// da página (único <h1>), atalho de nova movimentação e menu do usuário.
function Header({ title, section, onMenuClick }) {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const displayName = user?.name || 'Usuário';
  const email = user?.email;

  function handleNewEntry(action, close) {
    // Sem devolver o foco ao gatilho: quem recebe o foco é o campo da página.
    close({ returnFocus: false });
    navigate(action.to, { state: { newEntry: true } });
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="app-header">
      <IconButton
        icon="menu"
        label="Abrir menu"
        className="app-header__menu"
        onClick={onMenuClick}
      />

      <div className="app-header__title">
        {section && <span className="app-header__section">{section}</span>}
        <h1>{title}</h1>
      </div>

      <div className="app-header__actions">
        <Popover
          label="Nova movimentação"
          align="end"
          triggerClassName="app-header__new"
          trigger={
            <>
              <Icon name="plus" size={16} />
              <span className="app-header__new-text">Nova movimentação</span>
            </>
          }
        >
          {({ close }) => (
            <ul className="ui-popover__list">
              {newEntryActions.map((action) => (
                <li key={action.to}>
                  <button
                    type="button"
                    className="ui-popover__item"
                    onClick={() => handleNewEntry(action, close)}
                  >
                    <Icon name={action.icon} size={18} />
                    {action.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Popover>

        <Popover
          label={`Menu do usuário: ${displayName}`}
          align="end"
          triggerClassName="app-header__user"
          trigger={
            <>
              <Avatar name={displayName} />
              <span className="app-header__user-text">
                <span className="app-header__user-name">{displayName}</span>
                {email && <span className="app-header__user-email">{email}</span>}
              </span>
              <Icon name="chevron-down" size={16} className="app-header__user-caret" />
            </>
          }
        >
          <div className="ui-popover__identity">
            <Avatar name={displayName} size="lg" />
            <div>
              <p className="ui-popover__identity-name">{displayName}</p>
              {email && <p className="ui-popover__identity-email">{email}</p>}
            </div>
          </div>

          <ul className="ui-popover__list">
            <li>
              <button type="button" className="ui-popover__item" onClick={handleLogout}>
                <Icon name="logout" size={18} />
                Sair
              </button>
            </li>
          </ul>
        </Popover>
      </div>
    </header>
  );
}

export default Header;
