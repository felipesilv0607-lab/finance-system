import { getAuthorizationHeader } from './authService';

const API_URL = 'http://localhost:3000/api/transactions';

async function handleResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = response.status;
    error.details = data.details;
    throw error;
  }

  return data;
}

async function createTransaction(transactionData) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader()
    },
    body: JSON.stringify(transactionData)
  });

  return handleResponse(response);
}

async function getTransactions(type) {
  const url = type
    ? `${API_URL}?type=${encodeURIComponent(type)}`
    : API_URL;

  const response = await fetch(url, {
    headers: {
      ...getAuthorizationHeader()
    }
  });

  return handleResponse(response);
}

async function getTransactionById(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: {
      ...getAuthorizationHeader()
    }
  });

  return handleResponse(response);
}

async function updateTransaction(id, transactionData) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthorizationHeader()
    },
    body: JSON.stringify(transactionData)
  });

  return handleResponse(response);
}

async function deleteTransaction(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      ...getAuthorizationHeader()
    }
  });

  return handleResponse(response);
}

export {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
};