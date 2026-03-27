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

export function getPendingUsers() {
    return apiClient.get('/admin/pending-users');
}

export function approveUser(id) {
    return apiClient.post(`/admin/users/${id}/approve`);
}

export function rejectUser(id) {
    return apiClient.post(`/admin/users/${id}/reject`);
}

export function deleteUser(id) {
    return apiClient.delete(`/admin/users/${id}`);
}

export function createUser(data) {
    return apiClient.post('/admin/users', data);
}
