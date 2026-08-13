import axios from 'axios';

axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;

      await new Promise(resolve => setTimeout(resolve, 2000));

      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;
