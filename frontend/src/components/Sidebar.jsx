import { useId } from 'react';
import { NavLink } from 'react-router-dom';
import { navigationGroups } from '../config/navigation';
import Icon from './ui/Icon';
import Logo from './ui/Logo';

// Conteúdo do menu lateral. Usado fixo no desktop e dentro do Drawer no
// tablet/celular (`onNavigate` fecha a gaveta ao escolher uma página).
function Sidebar({ onNavigate }) {
  // O menu existe duas vezes no DOM (fixo e na gaveta): ids precisam ser únicos.
  const idPrefix = useId();

  return (
    <div className="sidebar">
      <NavLink to="/" className="sidebar__brand" aria-label="Finance System — ir para o Dashboard" onClick={onNavigate}>
        <Logo inverse />
      </NavLink>

      <nav className="sidebar__nav" aria-label="Menu principal">
        {navigationGroups.map((group) => (
          <div key={group.id} className="sidebar__group">
            <p className="sidebar__group-label" id={`${idPrefix}-${group.id}`}>
              {group.label}
            </p>

            <ul className="sidebar__list" aria-labelledby={`${idPrefix}-${group.id}`}>
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className="sidebar__link"
                    onClick={onNavigate}
                  >
                    <Icon name={item.icon} size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;
