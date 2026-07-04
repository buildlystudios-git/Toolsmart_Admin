import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { toggleCollapse, setMobileOpen } from '../../redux/slices/sidebarSlice';
import { logout } from '../../redux/slices/authSlice';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import ConfirmModal from '../modals/ConfirmModal';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/users', icon: '👥', label: 'Users' },
  { to: '/orders', icon: '📦', label: 'Orders' },
  { to: '/categories', icon: '🏷️', label: 'Categories' },
  { to: '/coupons', icon: '🎟️', label: 'Coupons' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isCollapsed, isMobileOpen } = useAppSelector((s) => s.sidebar);
  const { user } = useAppSelector((s) => s.auth);
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isOpen = isMobileOpen || !isCollapsed;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 h-full border-r sidebar-transition overflow-hidden"
        style={{
          width: isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border)',
        }}
      >
        <SidebarContent isCollapsed={isCollapsed} user={user} onLogout={() => setShowLogout(true)} onToggle={() => dispatch(toggleCollapse())} />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`fixed lg:hidden top-0 left-0 h-full z-30 flex flex-col sidebar-transition ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 'var(--sidebar-width)', background: 'var(--bg-secondary)', borderRight: `1px solid var(--border)` }}
      >
        <SidebarContent isCollapsed={false} user={user} onLogout={() => setShowLogout(true)} onToggle={() => dispatch(setMobileOpen(false))} />
      </aside>

      <ConfirmModal
        open={showLogout}
        title="Sign Out"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </>
  );
}

function SidebarContent({ isCollapsed, user, onLogout, onToggle }: { isCollapsed: boolean; user: any; onLogout: () => void; onToggle: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 h-16 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: 'var(--accent)' }}>
              A
            </div>
            <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>AdminOS</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm mx-auto" style={{ background: 'var(--accent)' }}>
            A
          </div>
        )}
        {!isCollapsed && (
          <button onClick={onToggle} className="btn btn-ghost btn-icon p-1.5 ml-auto" title="Collapse">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
            <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}`} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Administrator</div>
            </div>
            <button onClick={onLogout} className="btn btn-ghost btn-icon p-1" title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        ) : (
          <button onClick={onLogout} className="sidebar-item w-full justify-center" title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
