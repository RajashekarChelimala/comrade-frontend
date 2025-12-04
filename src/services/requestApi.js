import { apiClient } from './apiClient.js';

export function getIncomingRequests() {
  return apiClient.get('/requests/incoming');
}

export function getOutgoingRequests() {
  return apiClient.get('/requests/outgoing');
}

export function sendRequest(recipientId) {
  return apiClient.post('/requests', { recipientId });
}

export function acceptRequest(id) {
  return apiClient.post(`/requests/${id}/accept`, {});
}

export function rejectRequest(id) {
  return apiClient.post(`/requests/${id}/reject`, {});
}
