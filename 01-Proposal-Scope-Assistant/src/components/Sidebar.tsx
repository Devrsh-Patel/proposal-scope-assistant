import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Package,
  Settings,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/proposals', icon: FileText, label: 'Proposals' },
  { to: '/packages', icon: Package, label: 'Service Packages' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          style={{
            position: 'fixed', inset: 0, zIndex: 150,
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar${isOpen ? ' open' : ''}`} aria-label="Main navigation">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark" aria-hidden="true">S</div>
          <div>
            <div className="sidebar-logo-text">Scalezix</div>
            <div className="sidebar-logo-sub">Proposal Assistant</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          <p className="sidebar-section-label">Workspace</p>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
              aria-current={undefined}
              onClick={onClose}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              <ChevronRight
                style={{ marginLeft: 'auto', opacity: 0.3, width: 13, height: 13 }}
                aria-hidden="true"
              />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Proposal &amp; Scope-of-Work Assistant</p>
          <p style={{ marginTop: 2 }}>Scalezix Ventures LLP</p>
        </div>
      </aside>
    </>
  );
}
