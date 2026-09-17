import { getAuthorizationHeader } from './authService';

const API_URL = 'http://localhost:3000/api';

async function parseResponse(response, fallbackMessage) {
  const data = response.status === 204
    ? null
    : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || fallbackMessage);
  }

  return data;
}

export async function getCategories(type) {
  const params = type ? `?type=${encodeURIComponent(type)}` : '';
  const response = await fetch(`${API_URL}/categories${params}`, {
    headers: getAuthorizationHeader(),
  });

  return parseResponse(response, 'Não foi possível carregar as categorias.');
}

export async function createCategory(categoryData) {
  const response = await fetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    body: JSON.stringify(categoryData),
  });

  return parseResponse(response, 'Não foi possível criar a categoria.');
}

export async function updateCategory(id, categoryData) {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader(),
    },
    body: JSON.stringify(categoryData),
  });

  return parseResponse(response, 'Não foi possível atualizar a categoria.');
}

export async function deleteCategory(id) {
  const response = await fetch(`${API_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: getAuthorizationHeader(),
  });

  return parseResponse(response, 'Não foi possível excluir a categoria.');
}
