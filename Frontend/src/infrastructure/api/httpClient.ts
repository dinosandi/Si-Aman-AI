import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api-siaman.madiunkab.go.id/v1';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds timeout (safe-route may take longer)
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

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor
httpClient.interceptors.response.use(
  (response) => {
    const data = response.data;
    const config = response.config as any;

    // Check if the response body indicates 401 unauthorized (success: false with statusCode: 401)
    if (data && data.success === false && (data.statusCode === 401 || data.status === 401)) {
      const isAuthRequest = config?.url?.endsWith('/auth/login') || config?.url?.endsWith('/auth/register') || config?.url?.endsWith('/auth/refresh-token');
      if (!isAuthRequest) {
        if (config._retry) {
          handleUnauthorized();
          return Promise.reject(data);
        }

        config._retry = true;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              config.headers.Authorization = `Bearer ${token}`;
              return httpClient(config);
            })
            .catch(err => Promise.reject(err));
        }

        isRefreshing = true;

        return new Promise((resolve, reject) => {
          httpClient.post('/auth/refresh-token')
            .then((res: any) => {
              if (res && res.success && res.data && res.data.accessToken) {
                const newToken = res.data.accessToken;
                localStorage.setItem('si_aman_token', newToken);
                processQueue(null, newToken);
                config.headers.Authorization = `Bearer ${newToken}`;
                resolve(httpClient(config));
              } else {
                processQueue(res || new Error('Refresh token failed'));
                handleUnauthorized();
                reject(res);
              }
            })
            .catch((err) => {
              processQueue(err);
              handleUnauthorized();
              reject(err);
            })
            .finally(() => {
              isRefreshing = false;
            });
        });
      }
      return Promise.reject(data);
    }
    return data;
  },
  (error: AxiosError) => {
    const config = error.config as any;
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
      
      const isAuthRequest = config?.url?.endsWith('/auth/login') || config?.url?.endsWith('/auth/register') || config?.url?.endsWith('/auth/refresh-token');

      if (error.response.status === 401 || (error.response.data as any)?.statusCode === 401) {
        if (!isAuthRequest) {
          if (config && config._retry) {
            handleUnauthorized();
            return Promise.reject(customError);
          }

          if (config) {
            config._retry = true;

            if (isRefreshing) {
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              })
                .then(token => {
                  config.headers.Authorization = `Bearer ${token}`;
                  return httpClient(config);
                })
                .catch(err => Promise.reject(err));
            }

            isRefreshing = true;

            return new Promise((resolve, reject) => {
              httpClient.post('/auth/refresh-token')
                .then((res: any) => {
                  if (res && res.success && res.data && res.data.accessToken) {
                    const newToken = res.data.accessToken;
                    localStorage.setItem('si_aman_token', newToken);
                    processQueue(null, newToken);
                    config.headers.Authorization = `Bearer ${newToken}`;
                    resolve(httpClient(config));
                  } else {
                    processQueue(res || new Error('Refresh token failed'));
                    handleUnauthorized();
                    reject(res);
                  }
                })
                .catch((err) => {
                  processQueue(err);
                  handleUnauthorized();
                  reject(err);
                })
                .finally(() => {
                  isRefreshing = false;
                });
            });
          }
        }
      }
    } else if (error.request) {
      customError.message = 'Koneksi gagal. Periksa koneksi internet Anda (Offline).';
      customError.code = 'NETWORK_OFFLINE';
    }

    return Promise.reject(customError);
  }
);
