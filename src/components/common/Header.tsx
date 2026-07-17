import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { toggleTheme } from '../../redux/slices/themeSlice';
import { toggleMobile, toggleCollapse } from '../../redux/slices/sidebarSlice';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/users': 'Users',
  '/orders': 'Orders',
  '/categories': 'Categories',
};

export default function Header() {
  const dispatch = useAppDispatch();
  const { mode } = useAppSelector((s) => s.theme);
  const { user } = useAppSelector((s) => s.auth);
  const location = useLocation();

  const title = Object.entries(pageTitles).find(([path]) => location.pathname.startsWith(path))?.[1] || 'Panel';

  return (
    <header
      className="flex items-center justify-between px-6 h-16 flex-shrink-0 border-b"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-4">
        {/* Mobile menu */}
        <button
          onClick={() => dispatch(toggleMobile())}
          className="btn btn-ghost btn-icon lg:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {/* Desktop collapse */}
        <button
          onClick={() => dispatch(toggleCollapse())}
          className="btn btn-ghost btn-icon hidden lg:flex"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => dispatch(toggleTheme())}
          className="btn btn-ghost btn-icon"
          title="Toggle theme"
        >
          {mode === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>



        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-[var(--border)] cursor-pointer text-white flex-shrink-0"
          style={{ background: 'var(--accent)' }}
        >
          AD
        </div>
      </div>
    </header>
  );
}
