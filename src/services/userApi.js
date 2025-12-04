import { apiClient } from './apiClient.js';

export function getMe() {
  return apiClient.get('/users/me');
}

export function updateMe(payload) {
  return apiClient.patch('/users/me', payload);
}

export function searchUsers(params) {
  const query = new URLSearchParams(params).toString();
  const q = query ? `?${query}` : '';
  return apiClient.get(`/users/search${q}`);
}

export function blockUser(id) {
  return apiClient.post(`/users/${id}/block`, {});
}

export function unblockUser(id) {
  return apiClient.post(`/users/${id}/unblock`, {});
}

export function muteUser(id) {
  return apiClient.post(`/users/${id}/mute`, {});
}

export function unmuteUser(id) {
  return apiClient.post(`/users/${id}/unmute`, {});
}

export function reportUser(id, reason) {
  return apiClient.post(`/users/${id}/report`, { reason });
}
