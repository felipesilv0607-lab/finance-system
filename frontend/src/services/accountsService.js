const API_URL = 'http://localhost:3000/api';

export async function getAccounts() {
  const response = await fetch(`${API_URL}/accounts`);

  if (!response.ok) {
    throw new Error('Não foi possível carregar as contas.');
  }

  return response.json();
}
