import { del, get, post, put } from './api';

const API_PATH = '/transactions';

async function createTransaction(transactionData) {
  return post(API_PATH, transactionData);
}

async function getTransactions(type) {
  const params = type
    ? `?type=${encodeURIComponent(type)}`
    : '';

  return get(`${API_PATH}${params}`);
}

async function getTransactionById(id) {
  return get(`${API_PATH}/${id}`);
}

async function updateTransaction(id, transactionData) {
  return put(`${API_PATH}/${id}`, transactionData);
}

async function deleteTransaction(id) {
  return del(`${API_PATH}/${id}`);
}

export {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction
};