/**
 * tokenStorage.ts
 * Web equivalent of your React Native UserPrefs + MMKV layer.
 * All token reads/writes go through here — nothing touches
 * localStorage directly outside this file.
 */

const KEYS = {
  ACCESS_TOKEN: 'admin_access_token',
  REFRESH_TOKEN: 'admin_refresh_token',
  USER: 'admin_user',
} as const;

// ─── Access Token ───────────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem(KEYS.ACCESS_TOKEN);
}

export function saveAccessToken(token: string): void {
  localStorage.setItem(KEYS.ACCESS_TOKEN, token);
}

export function removeAccessToken(): void {
  localStorage.removeItem(KEYS.ACCESS_TOKEN);
}

// ─── Refresh Token ──────────────────────────────────────────────
export function getRefreshToken(): string | null {
  return localStorage.getItem(KEYS.REFRESH_TOKEN);
}

export function saveRefreshToken(token: string): void {
  localStorage.setItem(KEYS.REFRESH_TOKEN, token);
}

export function removeRefreshToken(): void {
  localStorage.removeItem(KEYS.REFRESH_TOKEN);
}

// ─── User ───────────────────────────────────────────────────────
export function getSavedUser<T = unknown>(): T | null {
  try {
    const raw = localStorage.getItem(KEYS.USER);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveUser<T>(user: T): void {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export function removeUser(): void {
  localStorage.removeItem(KEYS.USER);
}

// ─── Nuke everything on full logout ────────────────────────────
export function clearAllTokens(): void {
  removeAccessToken();
  removeRefreshToken();
  removeUser();
}
