import { AuthResponse, User, UserRole } from '@sakany/shared';

const AUTH_TOKEN_KEY = 'sakany_token';
const REFRESH_TOKEN_KEY = 'sakany_refresh';
const AUTH_USER_KEY = 'sakany_user';
const AUTH_COOKIE = 'sakany_token';

function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  // httpOnly is not possible from client JS; this cookie is a UX guard for middleware.
  // Real authorization is enforced server-side in the API routes.
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=2592000; samesite=lax`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export function saveAuthSession(data: AuthResponse) {
  localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
  setAuthCookie(data.accessToken);
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAuthUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(AUTH_USER_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export function getAuthRole(): UserRole | null {
  return getAuthUser()?.role ?? null;
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  clearAuthCookie();
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}