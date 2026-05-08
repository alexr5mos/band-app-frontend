import axios from 'axios';
import { useStore } from './store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = useStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  signup: (email, password, username, instrument) =>
    api.post('/auth/signup', { email, password, username, instrument }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
};

export const songsAPI = {
  getAll: () => api.get('/songs'),
  getOne: (id) => api.get(`/songs/${id}`),
  create: (data) => api.post('/songs', data),
  update: (id, data) => api.put(`/songs/${id}`, data),
  updateDetails: (id, data) => api.put(`/songs/${id}/details`, data),
  delete: (id) => api.delete(`/songs/${id}`),
};

export const uploadAPI = {
  audio: (songId, file) => {
    const formData = new FormData();
    formData.append('audio', file);
    return api.post(`/upload/audio/${songId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAudio: (songId) => api.get(`/upload/song/${songId}`),
};

export default api;
