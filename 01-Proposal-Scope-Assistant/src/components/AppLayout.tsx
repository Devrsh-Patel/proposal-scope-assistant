import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Notifications from './Notifications';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/proposals': 'Proposals',
  '/proposals/new': 'New Proposal',
  '/packages': 'Service Packages',
  '/packages/new': 'New Package',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith('/proposals/') ? 'Proposal' : 'Page');

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <button
            className="btn btn-ghost btn-sm menu-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            id="menu-toggle"
          >
            {sidebarOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <h1 className="topbar-title">{title}</h1>
        </header>

        <main id="main-content" className="page-container fade-in">
          <Outlet />
        </main>
      </div>

      <Notifications />
    </div>
  );
}
