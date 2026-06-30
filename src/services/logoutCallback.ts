/**
 * logoutCallback.ts
 *
 * A tiny pub/sub bridge so AxiosBase (a plain module) can
 * tell the Redux store to clear auth state without a circular import.
 *
 * Usage:
 *   1. In App.tsx (or main.tsx) call registerLogoutCallback(fn)
 *      where fn dispatches the Redux logout action.
 *   2. AxiosBase calls triggerLogout() when refresh fails.
 */

type LogoutFn = () => void;

let _logoutCallback: LogoutFn | null = null;

/** Called once at app startup — registers the Redux logout dispatcher. */
export function registerLogoutCallback(fn: LogoutFn): void {
  _logoutCallback = fn;
}

/** Called by AxiosBase when a token refresh fails. */
export function triggerLogout(): void {
  if (_logoutCallback) {
    _logoutCallback();
  }
}
