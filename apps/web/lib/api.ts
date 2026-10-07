import { AuthResponse } from '@sakany/shared';
import { clearAuthSession, getAuthToken, saveAuthSession } from './auth';

const API_PREFIX = '/api';

export function getApiBaseUrl() {
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
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(buildApiUrl(path), {
    ...options,
    headers,
    cache: options.cache ?? 'no-store',
    credentials: 'same-origin',
  });

  if (res.status === 401) {
    const newTokens = await attemptTokenRefresh();
    if (newTokens) {
      headers.Authorization = `Bearer ${newTokens.accessToken}`;
      res = await fetch(buildApiUrl(path), {
        ...options,
        headers,
        cache: options.cache ?? 'no-store',
        credentials: 'same-origin',
      });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    let errorMessage = body.message ?? `Erreur API (${res.status})`;
    if (body.details && Array.isArray(body.details)) {
      errorMessage += ' : ' + body.details.map((d: any) => d.message).join(', ');
    }
    throw new Error(errorMessage);
  }

  return res.json();
}

async function attemptTokenRefresh(): Promise<AuthResponse | null> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(buildApiUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
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

export async function refreshAuthSession(): Promise<boolean> {
  const data = await attemptTokenRefresh();
  return !!data;
}

export function authHeaders(token?: string | null): HeadersInit {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
