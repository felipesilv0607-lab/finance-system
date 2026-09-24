import { clearSession, getAuthorizationHeader } from './authService';

const API_URL = 'http://localhost:3000/api';

async function request(path, options = {}) {
  const headers = {
    ...getAuthorizationHeader(),
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (response.status === 401) {
    clearSession();

    if (window.location.pathname !== '/login') {
      window.location.assign('/login');
    }

    const error = new Error(
      data?.error || 'Sua sessão expirou. Faça login novamente.'
    );

    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      data?.error || 'Não foi possível concluir a requisição.'
    );

    error.status = response.status;
    error.details = data?.details;

    throw error;
  }

  return data;
}

export function get(path) {
  return request(path);
}

export function post(path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export function put(path, body) {
  return request(path, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export function del(path) {
  return request(path, {
    method: 'DELETE'
  });
}