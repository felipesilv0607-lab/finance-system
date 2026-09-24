import { del, get, post, put } from './api';

export async function getAccounts() {
  return get('/accounts');
}

export async function createAccount(accountData) {
  return post('/accounts', accountData);
}

export async function updateAccount(id, accountData) {
  return put(`/accounts/${id}`, accountData);
}

export async function deleteAccount(id) {
  return del(`/accounts/${id}`);
}
