import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

function AppLayout({ children, title = 'Dashboard', section = 'VISÃO GERAL' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="app-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {sidebarOpen && (
        <button
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-label="Fechar menu"
        />
      )}

      <main className="main-content">
        <Header
          title={title}
          section={section}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {children}
      </main>
    </div>
  );
}

export default AppLayout;
