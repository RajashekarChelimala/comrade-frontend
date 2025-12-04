const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function getAccessToken() {
  try {
    const raw = localStorage.getItem('comrade_auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.accessToken || null;
  } catch (e) {
    return null;
  }
}

function getCsrfToken() {
  return localStorage.getItem('comrade_csrf') || null;
}

async function request(path, options = {}) {
  const token = getAccessToken();
  const csrf = getCsrfToken();
  const method = (options.method || 'GET').toUpperCase();
  const isMutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isMutating && csrf ? { 'X-CSRF-Token': csrf } : {}),
      ...(options.headers || {}),
    },
    credentials: 'include',
    ...options,
  });

  const contentType = res.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = body?.message || 'Request failed';
    throw new Error(message);
  }

  return body;
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
