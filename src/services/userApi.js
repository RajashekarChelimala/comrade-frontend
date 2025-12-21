import { apiClient } from './apiClient.js';

export function getMe() {
  return apiClient.get('/users/me');
}

export function updateMe(payload) {
  return apiClient.patch('/users/me', payload);
}

export function searchUsers({ query, by }) {
  const params = new URLSearchParams({ query });
  if (by) params.append('by', by);
  return apiClient.get(`/users/search?${params}`);
}

export function getFriends() {
  return apiClient.get('/users/friends');
}

export function removeFriend(userId) {
  return apiClient.delete(`/users/friends/${userId}`);
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
