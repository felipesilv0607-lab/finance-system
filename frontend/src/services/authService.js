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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  return parseResponse(response, 'Não foi possível criar a conta.');
}

export async function loginUser(credentials) {
  const response = await fetch(`${API_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const session = await parseResponse(response, 'Não foi possível entrar.');
  saveSession(session);
  return session;
}

export function getAuthorizationHeader() {
  const token = readSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function isAuthenticated() {
  return Boolean(readSession()?.token);
}

export function clearSession() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

// This module is the persistence boundary. Moving to HttpOnly cookies only
// requires replacing its storage/header behavior, not the callers' contracts.
