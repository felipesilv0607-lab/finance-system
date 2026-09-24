import { del, get, post, put } from './api';

export async function getCategories(type) {
  const params = type ? `?type=${encodeURIComponent(type)}` : '';

  return get(`/categories${params}`);
}

export async function createCategory(categoryData) {
  return post('/categories', categoryData);
}

export async function updateCategory(id, categoryData) {
  return put(`/categories/${id}`, categoryData);
}

export async function deleteCategory(id) {
  return del(`/categories/${id}`);
}
