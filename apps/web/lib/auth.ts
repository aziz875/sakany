import { AuthResponse, User, UserRole } from '@sakany/shared';

const AUTH_TOKEN_KEY = 'sakany_token';
const AUTH_USER_KEY = 'sakany_user';

export function saveAuthSession(data: AuthResponse) {
  localStorage.setItem(AUTH_TOKEN_KEY, data.accessToken);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
}

export function updateStoredUser(user: User) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
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
  localStorage.removeItem(AUTH_USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
