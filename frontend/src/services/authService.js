const API_URL = 'http://localhost:3000/api';
const SESSION_STORAGE_KEY = 'finance-system.session';

function readSession() {
  const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);

  if (!storedSession) return null;

  try {
    return JSON.parse(storedSession);
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function isTokenExpired(token) {
  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return true;
    }

    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    if (typeof payload.exp !== 'number') {
      return true;
    }

    return payload.exp <= Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

async function parseResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
}

export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  return parseResponse(response, 'Não foi possível criar a conta.');
}

export async function loginUser(credentials) {
  const response = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });

  const session = await parseResponse(
    response,
    'Não foi possível entrar.'
  );

  saveSession(session);

  return session;
}

export function getAuthorizationHeader() {
  const token = readSession()?.token;

  if (!token || isTokenExpired(token)) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

export function isAuthenticated() {
  const token = readSession()?.token;

  if (!token) {
    return false;
  }

  if (isTokenExpired(token)) {
    clearSession();
    return false;
  }

  return true;
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

// Este módulo é responsável pela persistência da sessão.
// Se futuramente migrarmos para cookies HttpOnly, será necessário
// alterar apenas a forma de armazenamento e envio da sessão,
// sem precisar alterar os módulos que utilizam este serviço.