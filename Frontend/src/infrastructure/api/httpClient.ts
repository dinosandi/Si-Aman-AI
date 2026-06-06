import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api-siaman.madiunkab.go.id/v1';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
  withCredentials: true,
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

const handleUnauthorized = () => {
  localStorage.removeItem('si_aman_token');
  localStorage.removeItem('si_aman_user');
  localStorage.removeItem('warga_authenticated');
  localStorage.removeItem('admin_authenticated');
  
  localStorage.setItem('auth_flash_message', 'Sesi telah habis. Silakan melakukan login ulang untuk melanjutkan.');
  
  const currentPath = window.location.pathname;
  const redirectPath = currentPath.startsWith('/admin') ? '/admin' : '/warga';
  
  if (currentPath !== redirectPath) {
    window.location.href = redirectPath;
  }
};

// Response Interceptor
httpClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    // Check if the response body indicates 401 unauthorized (success: false with statusCode: 401)
    if (data && data.success === false && (data.statusCode === 401 || data.status === 401)) {
      const isAuthRequest = response.config?.url?.endsWith('/auth/login') || response.config?.url?.endsWith('/auth/register');
      if (!isAuthRequest) {
        handleUnauthorized();
      }
      return Promise.reject(data);
    }
    return data;
  },
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
      
      const isAuthRequest = error.config?.url?.endsWith('/auth/login') || error.config?.url?.endsWith('/auth/register');

      if (error.response.status === 401 || (error.response.data as any)?.statusCode === 401) {
        if (!isAuthRequest) {
          handleUnauthorized();
        }
      }
    } else if (error.request) {
      customError.message = 'Koneksi gagal. Periksa koneksi internet Anda (Offline).';
      customError.code = 'NETWORK_OFFLINE';
    }

    return Promise.reject(customError);
  }
);
