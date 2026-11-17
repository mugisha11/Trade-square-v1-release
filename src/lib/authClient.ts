import { resolveApiUrl } from './apiBase';

const SESSION_STORAGE_KEY = 'ts_session_token';

export function getStoredSessionToken(): string | null {
  try {
    return window.localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredSessionToken(token: string | null | undefined): void {
  try {
    if (token) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors in restricted browser contexts
  }
}

export function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getStoredSessionToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const resolved =
    typeof input === 'string'
      ? resolveApiUrl(input)
      : input instanceof URL
        ? resolveApiUrl(input.toString())
        : input;

  return fetch(resolved, {
    ...init,
    headers,
    credentials: init.credentials ?? 'include',
  });
}
