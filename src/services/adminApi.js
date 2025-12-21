import { apiClient } from './apiClient.js';

export function getAllUsers() {
    return apiClient.get('/admin/users');
}

export function getFlags() {
    return apiClient.get('/admin/flags');
}

export function updateFlag(key, enabled) {
    return apiClient.patch(`/admin/flags/${key}`, { enabled });
}
