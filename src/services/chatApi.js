import { apiClient } from './apiClient.js';

export function getChats() {
  return apiClient.get('/chats');
}

export function createChat(recipientId) {
  return apiClient.post('/chats', { recipientId });
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

export function editMessage(messageId, text) {
  return apiClient.patch(`/chats/messages/${messageId}`, { text });
}

export function reactToMessage(messageId, type) {
  return apiClient.post(`/chats/messages/${messageId}/react`, { type });
}

export function removeReaction(messageId) {
  return apiClient.delete(`/chats/messages/${messageId}/react`);
}

export function markAsRead(chatId) {
  return apiClient.post(`/chats/${chatId}/read`);
}

export function createGroupChat(payload) {
  return apiClient.post('/chats/group', payload);
}

export function updateChatSettings(chatId, settings) {
  return apiClient.patch(`/chats/${chatId}/settings`, settings);
}

export function saveAsMemory(chatId, payload) {
  return apiClient.post(`/chats/${chatId}/memories`, payload);
}

export function getMemories(chatId) {
  return apiClient.get(`/chats/${chatId}/memories`);
}

export function deleteMemory(chatId, memoryId) {
  return apiClient.delete(`/chats/${chatId}/memories/${memoryId}`);
}

export function convertToTask(chatId, payload) {
  return apiClient.post(`/chats/${chatId}/tasks`, payload);
}

export function getTasks(chatId) {
  return apiClient.get(`/chats/${chatId}/tasks`);
}

export function deleteTask(chatId, taskId) {
  return apiClient.delete(`/chats/${chatId}/tasks/${taskId}`);
}

export function updateTaskStatus(chatId, taskId, status) {
  return apiClient.patch(`/chats/${chatId}/tasks/${taskId}`, { status });
}

export function voteInPoll(messageId, optionIndex) {
  return apiClient.post(`/chats/messages/${messageId}/vote`, { optionIndex });
}

export function pinMessage(messageId) {
  return apiClient.post(`/chats/messages/${messageId}/pin`);
}

export function unpinMessage(messageId) {
  return apiClient.delete(`/chats/messages/${messageId}/pin`);
}
