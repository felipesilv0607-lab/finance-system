const API_URL = 'http://localhost:3000/api';

export async function getAccounts() {
  const response = await fetch(`${API_URL}/accounts`, {
    headers: getAuthorizationHeader(),
  });

  if (!response.ok) {
    throw new Error('Não foi possível carregar as contas.');
  }

  return response.json();
}

export async function createAccount(accountData) {
  const response = await fetch(`${API_URL}/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    body: JSON.stringify(accountData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.error || 'Não foi possível criar a conta.'
    );
  }

  return response.json();
}

export async function updateAccount(id, accountData) {
  const response = await fetch(`${API_URL}/accounts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    body: JSON.stringify(accountData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.error || 'Não foi possível atualizar a conta.'
    );
  }

  return response.json();
}

export async function deleteAccount(id) {
  const response = await fetch(`${API_URL}/accounts/${id}`, {
    method: 'DELETE',
    headers: getAuthorizationHeader(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.error || 'Não foi possível excluir a conta.'
    );
  }
}







import { getAuthorizationHeader } from './authService';
