import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Set auth token
  } else {
    delete api.defaults.headers.common['Authorization']; // Remove auth token
  }
};

// Request logging
api.interceptors.request.use(request => {
  console.log('Starting Request:', request);
  return request;
});

// Response logging and error handling
api.interceptors.response.use(
  response => {
    console.log('Response:', response);
    return response;
  },
  error => {
    console.error('API Error:', error.config, error.response);
    return Promise.reject(error);
  }
);

export default api;