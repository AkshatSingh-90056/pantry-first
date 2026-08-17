import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api',
  timeout: 15000,
});

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const apiError = error?.response?.data?.error;

  if (typeof apiError === 'string') {
    return apiError;
  }

  return apiError?.message || error?.message || fallback;
}

export default apiClient;
