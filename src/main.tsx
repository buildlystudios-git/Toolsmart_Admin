import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { store } from './redux/store';
import { logout } from './redux/slices/authSlice';
import { registerLogoutCallback } from './services/logoutCallback';
import App from './App';
import './index.css';

// Init theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') document.documentElement.classList.add('dark');

// ── Wire up the AxiosBase → Redux bridge ─────────────────────────
// When a token refresh fails inside AxiosBase, this callback fires
// so the Redux store is cleared in sync with the hard redirect.
registerLogoutCallback(() => {
  store.dispatch(logout());
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
            },
          }}
        />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);
