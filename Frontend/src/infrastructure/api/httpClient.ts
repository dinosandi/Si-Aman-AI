import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api-siaman.madiunkab.go.id/v1';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request Interceptor
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('si_aman_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
httpClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    // Premium global error formatting
    const customError = {
      message: 'Terjadi kesalahan sistem. Silakan coba lagi nanti.',
      status: error.response?.status,
      errors: (error.response?.data as any)?.errors || null,
      code: (error.response?.data as any)?.code || 'UNKNOWN_ERROR',
    };

    if (error.response) {
      const serverMessage = (error.response.data as any)?.message;
      if (serverMessage) customError.message = serverMessage;
      
      if (error.response.status === 401) {
        // Handle Unauthorized, redirect or logout
        localStorage.removeItem('si_aman_token');
        localStorage.removeItem('si_aman_user');
        // Optional: trigger redirect to login in presentation layer or router
      }
    } else if (error.request) {
      customError.message = 'Koneksi gagal. Periksa koneksi internet Anda (Offline).';
      customError.code = 'NETWORK_OFFLINE';
    }

    return Promise.reject(customError);
  }
);
