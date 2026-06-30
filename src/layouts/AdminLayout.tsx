import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { setMobileOpen } from '../redux/slices/sidebarSlice';

export default function AdminLayout() {
  const { isCollapsed, isMobileOpen } = useAppSelector((s) => s.sidebar);
  const dispatch = useAppDispatch();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => dispatch(setMobileOpen(false))}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-250"
        style={{ marginLeft: 0 }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-6" style={{ background: 'var(--bg-primary)' }}>
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
