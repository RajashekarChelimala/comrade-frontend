import { apiClient } from './apiClient.js';

export function verifyEmailApi(payload) {
  return apiClient.post('/auth/verify-email', payload);
}

export function resendVerificationApi(payload) {
  return apiClient.post('/auth/resend-verification', payload);
}
