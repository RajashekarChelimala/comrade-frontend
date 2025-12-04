import { apiClient } from './apiClient.js';

export function getChats() {
  return apiClient.get('/chats');
}

export function getChat(chatId) {
  return apiClient.get(`/chats/${chatId}`);
}

export function getMessages(chatId, params = {}) {
  const query = new URLSearchParams(params).toString();
  const q = query ? `?${query}` : '';
  return apiClient.get(`/chats/${chatId}/messages${q}`);
}

export function sendMessage(chatId, payload) {
  return apiClient.post(`/chats/${chatId}/messages`, payload);
}

export function reactToMessage(messageId, type) {
  return apiClient.post(`/chats/messages/${messageId}/react`, { type });
}

export function removeReaction(messageId) {
  return apiClient.delete(`/chats/messages/${messageId}/react`);
}
