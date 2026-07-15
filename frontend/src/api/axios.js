import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({ baseURL: `${baseURL}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('evms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// bad/expired token -> just drop the session, don't loop on 401s
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('evms_token');
      localStorage.removeItem('evms_user');
    }
    return Promise.reject(error);
  }
);

export default api;
