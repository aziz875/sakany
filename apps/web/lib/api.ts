import { AuthResponse } from '@sakany/shared';
import { clearAuthSession, getAuthToken, getRefreshToken, saveAuthSession } from './auth';

const API_PREFIX = '/api';

function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/api')
    ? path
    : `${API_PREFIX}${path.startsWith('/') ? path : `/${path}`}`;

  return `${getApiBaseUrl()}${normalizedPath}`;
}

let isRefreshing = false;
let refreshPromise: Promise<AuthResponse | null> | null = null;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(buildApiUrl(path), {
    ...options,
    headers,
    cache: options.cache ?? 'no-store',
  });

  if (res.status === 401 && token) {
    const newTokens = await attemptTokenRefresh();
    if (newTokens) {
      headers.Authorization = `Bearer ${newTokens.accessToken}`;
      res = await fetch(buildApiUrl(path), {
        ...options,
        headers,
        cache: options.cache ?? 'no-store',
      });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `Erreur API (${res.status})`);
  }

  return res.json();
}

async function attemptTokenRefresh(): Promise<AuthResponse | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthSession();
    return null;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(buildApiUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearAuthSession();
        return null;
      }

      const data: AuthResponse = await res.json();
      saveAuthSession(data);
      return data;
    } catch {
      clearAuthSession();
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export function authHeaders(token?: string | null): HeadersInit {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
