/**
 * api.ts  —  AxiosBase equivalent for the Admin Panel (web)
 *
 * Mirrors your React Native AxiosBase exactly:
 *   ✅ Request interceptor  — attaches Bearer token + Content-Type
 *   ✅ Response interceptor — logs, handles 401, refreshes token
 *   ✅ _retry flag          — prevents infinite refresh loops
 *   ✅ Concurrency queue    — if multiple requests 401 at once,
 *                             only ONE refresh call is made; all
 *                             pending requests resume after it resolves
 *   ✅ Hard logout          — clears tokens + redirects to /login
 *                             when refresh itself fails
 */

import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  getToken,
  getRefreshToken,
  saveAccessToken,
  saveRefreshToken,
  removeAccessToken,
  removeRefreshToken,
} from './tokenStorage';

// ─────────────────────────────────────────────────────────────────
// Extend Axios types so _retry is recognised without TS errors
// ─────────────────────────────────────────────────────────────────
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// ─────────────────────────────────────────────────────────────────
// Concurrency control
// While a refresh is in-flight, queue every new 401'd request here.
// Once the refresh resolves (or rejects) we flush the queue.
// ─────────────────────────────────────────────────────────────────
let isRefreshing = false;

type QueueItem = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      item.resolve(token!);
    }
  });
  failedQueue = [];
}

// ─────────────────────────────────────────────────────────────────
// Hard logout — clears storage and sends user to /login
// ─────────────────────────────────────────────────────────────────
function hardLogout(): void {
  removeAccessToken();
  removeRefreshToken();

  // Let the Redux store know too (imported lazily to avoid circular deps)
  import('./logoutCallback').then((m) => m.triggerLogout()).catch(() => { });

  // Small delay so the above import can fire before the redirect
  setTimeout(() => {
    window.location.replace('/login');
  }, 100);
}

// ─────────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────────
const AxiosBase = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/',
  timeout: 10_000,
});

// ═══════════════════════════════════════════════════════════════
//  REQUEST INTERCEPTOR
// ═══════════════════════════════════════════════════════════════
AxiosBase.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();

    // Attach auth header if not already set
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Content-Type: let FormData set its own boundary; everything else → JSON
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else {
      config.headers['Content-Type'] = 'application/json';
    }

    // ── REQUEST LOG ──────────────────────────────────────────
    if (import.meta.env.DEV) {
      console.log('========== API REQUEST ==========');
      console.log('URL    =>', `${config.baseURL ?? ''}${config.url ?? ''}`);
      console.log('METHOD =>', config.method?.toUpperCase());
      console.log('TOKEN  =>', token ? `${token.slice(0, 20)}…` : 'none');
      console.log('HEADERS=>', config.headers);
      console.log('PARAMS =>', config.params);
      console.log('BODY   =>', config.data);
      console.log('=================================');
    }

    return config;
  },

  (error: AxiosError) => {
    console.error('REQUEST ERROR =>', error);
    return Promise.reject(error);
  },
);

// ═══════════════════════════════════════════════════════════════
//  RESPONSE INTERCEPTOR
// ═══════════════════════════════════════════════════════════════
AxiosBase.interceptors.response.use(
  (response) => {
    // ── RESPONSE LOG ─────────────────────────────────────────
    if (import.meta.env.DEV) {
      console.log('========== API RESPONSE ==========');
      console.log('URL    =>', response.config.url);
      console.log('STATUS =>', response.status);
      console.log('DATA   =>', response.data);
      console.log('==================================');
    }

    return response;
  },

  async (error: AxiosError<{ message?: string }>) => {
    // ── ERROR LOG ─────────────────────────────────────────────
    if (import.meta.env.DEV) {
      console.log('========== API ERROR ==========');
      console.log('URL     =>', error.config?.url);
      console.log('STATUS  =>', error.response?.status);
      console.log('MESSAGE =>', error.message);
      console.log('DATA    =>', error.response?.data);
      console.log('================================');
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // ── 401 HANDLING ─────────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('401 intercepted — attempting token refresh');

      // ── Already refreshing? Queue this request ────────────
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return AxiosBase(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // ── Start refresh ─────────────────────────────────────
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      console.log('Refresh Token =>', refreshToken ? `${refreshToken.slice(0, 20)}…` : 'none');

      try {
        // Mirrors your RN code exactly — raw axios, not AxiosBase,
        // to avoid triggering the interceptor recursively.
        const { data } = await axios.post<{ accessToken: string; refreshToken?: string }>(
          '/auth/refresh',
          {},
          {
            baseURL: AxiosBase.defaults.baseURL,
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );

        console.log('Refresh Success — new token received');

        // Persist the new access token
        saveAccessToken(data.accessToken);
        if (data.refreshToken) {
          saveRefreshToken(data.refreshToken);
        }

        // Update auth header for the original failed request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        // Flush the queue — all queued requests get the new token
        processQueue(null, data.accessToken);

        // Retry the original request
        return AxiosBase(originalRequest);

      } catch (refreshError: unknown) {
        const axiosRefreshError = refreshError as AxiosError;
        console.error(
          'Refresh Failed =>',
          axiosRefreshError?.response?.status,
          axiosRefreshError?.response?.data,
        );

        // Reject all queued requests
        processQueue(refreshError, null);

        // Full logout — clears storage + redirects
        hardLogout();

        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    // ── All other errors — return normalised error object ────
    return Promise.reject(
      error.response?.data || { message: error.message || 'Something went wrong' },
    );
  },
);

export default AxiosBase;
