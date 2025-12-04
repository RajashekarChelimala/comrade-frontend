import { apiClient } from './apiClient.js';

export function registerApi(payload) {
  return apiClient.post('/auth/register', payload);
}

export function loginApi(payload) {
  return apiClient.post('/auth/login', payload);
}

export function refreshApi() {
  return apiClient.post('/auth/refresh', {});
}

export function meApi() {
  return apiClient.get('/auth/me');
}
