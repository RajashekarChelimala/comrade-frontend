import { apiClient } from './apiClient.js';

export function uploadMedia(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.upload('/media/upload', formData);
}
