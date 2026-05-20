import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import Cookies from 'js-cookie';
import { ApiError, ApiResponse } from '@/lib/types/api';

// JWT token management
const JWT_COOKIE_NAME = process.env.NEXT_PUBLIC_JWT_COOKIE_NAME || 'admin_token';
const REFRESH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME || 'admin_refresh_token';
// The admin panel talks to a single BFF — admin-service — which mounts every
// other domain handler (auth, analytics, fraud, promos, notifications, …) in
// process. There is no separate gateway: the k8s Ingress routes /admin/* and
// /api/v1/* to admin-service in staging/prod; in dev this is just port 8088.
const ADMIN_BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:8088';

export const getToken = (): string | undefined => {
  return Cookies.get(JWT_COOKIE_NAME);
};

export const setToken = (token: string): void => {
  // Set cookie with 7 days expiry, secure in production
  Cookies.set(JWT_COOKIE_NAME, token, {
    expires: 7,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};

export const removeToken = (): void => {
  Cookies.remove(JWT_COOKIE_NAME);
};

// Refresh token management — the refresh token is longer-lived than the access
// token and is exchanged for a fresh token pair when the access token expires.
export const getRefreshToken = (): string | undefined => {
  return Cookies.get(REFRESH_COOKIE_NAME);
};

export const setRefreshToken = (token: string): void => {
  Cookies.set(REFRESH_COOKIE_NAME, token, {
    expires: 30,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
};

export const removeRefreshToken = (): void => {
  Cookies.remove(REFRESH_COOKIE_NAME);
};

// clearSession removes both the access and refresh tokens.
export const clearSession = (): void => {
  removeToken();
  removeRefreshToken();
};

// Request interceptor to add JWT token
const authRequestInterceptor = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  const token = getToken();

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

// Response interceptor to handle errors
const responseInterceptor = (response: AxiosResponse): AxiosResponse => {
  return response;
};

// --- Token refresh -------------------------------------------------------

// A single in-flight refresh shared by all concurrent 401s, so the refresh
// endpoint is hit only once even when several requests fail simultaneously.
let refreshPromise: Promise<string> | null = null;

const performTokenRefresh = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // Raw axios call so this request bypasses the interceptors below and cannot
  // recurse back into the refresh logic.
  const res = await axios.post(
    `${ADMIN_BASE_URL}/api/v1/auth/refresh`,
    { refresh_token: refreshToken },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const data = res.data?.data;
  if (!data?.token) {
    throw new Error('Refresh response missing token');
  }

  setToken(data.token);
  if (data.refresh_token) {
    setRefreshToken(data.refresh_token);
  }
  return data.token as string;
};

const redirectToLogin = (): void => {
  if (
    typeof window !== 'undefined' &&
    !window.location.pathname.includes('/login')
  ) {
    window.location.href = '/login';
  }
};

// Error interceptor factory — bound to its client so it can retry the request
// after a successful token refresh.
const createErrorInterceptor =
  (client: AxiosInstance) => async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      throw new ApiError('An unexpected error occurred');
    }

    const statusCode = error.response?.status;
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;
    const rawError = error.response?.data?.error;
    const message =
      (typeof rawError === 'string'
        ? rawError
        : error.response?.data?.message || error.message) ||
      'An error occurred';

    // 401 Unauthorized — attempt one silent token refresh, then retry.
    if (statusCode === 401) {
      const isRefreshCall = originalRequest?.url?.includes('/auth/refresh');
      const canRetry =
        !!originalRequest &&
        !originalRequest._retried &&
        !isRefreshCall &&
        !!getRefreshToken();

      if (canRetry && originalRequest) {
        originalRequest._retried = true;
        try {
          if (!refreshPromise) {
            refreshPromise = performTokenRefresh().finally(() => {
              refreshPromise = null;
            });
          }
          const newToken = await refreshPromise;
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return client.request(originalRequest);
        } catch {
          clearSession();
          redirectToLogin();
          throw new ApiError('Session expired. Please log in again.', 401);
        }
      }

      // No refresh possible (or it already failed) — end the session.
      clearSession();
      redirectToLogin();
      throw new ApiError(message, statusCode);
    }

    // Handle 403 Forbidden - insufficient permissions
    if (statusCode === 403) {
      throw new ApiError('You do not have permission to perform this action', statusCode);
    }

    // Handle validation errors
    if (statusCode === 400 && error.response?.data?.errors) {
      throw new ApiError(message, statusCode, error.response.data.errors);
    }

    throw new ApiError(message, statusCode);
  };

// Create axios instance factory
const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Enable credentials (cookies) for CORS
  });

  // Add interceptors
  client.interceptors.request.use(authRequestInterceptor);
  client.interceptors.response.use(responseInterceptor, createErrorInterceptor(client));

  return client;
};

// The single API client — admin-service is the BFF for the entire admin panel.
export const adminClient = createApiClient(ADMIN_BASE_URL);

// Generic request wrapper with type safety
export async function apiRequest<T>(
  client: AxiosInstance,
  config: AxiosRequestConfig
): Promise<T> {
  const response = await client.request<ApiResponse<T>>(config);

  // Handle backend response envelope format
  if (response.data.success === false) {
    throw new ApiError(response.data.error || 'Request failed');
  }

  // For paginated responses, return both data and meta
  // Check if the response has both data array and meta object
  if (
    response.data.data &&
    Array.isArray(response.data.data) &&
    'meta' in response.data
  ) {
    return {
      data: response.data.data,
      meta: response.data.meta,
    } as T;
  }

  // For non-paginated responses, return just the data
  return response.data.data as T;
}

// Helper methods for common HTTP methods
export const api = {
  get: async <T>(
    client: AxiosInstance,
    url: string,
    params?: Record<string, unknown>
  ): Promise<T> => {
    return apiRequest<T>(client, { method: 'GET', url, params });
  },

  post: async <T>(
    client: AxiosInstance,
    url: string,
    data?: unknown
  ): Promise<T> => {
    return apiRequest<T>(client, { method: 'POST', url, data });
  },

  put: async <T>(
    client: AxiosInstance,
    url: string,
    data?: unknown
  ): Promise<T> => {
    return apiRequest<T>(client, { method: 'PUT', url, data });
  },

  delete: async <T>(
    client: AxiosInstance,
    url: string,
    data?: unknown
  ): Promise<T> => {
    return apiRequest<T>(client, { method: 'DELETE', url, data });
  },

  patch: async <T>(
    client: AxiosInstance,
    url: string,
    data?: unknown
  ): Promise<T> => {
    return apiRequest<T>(client, { method: 'PATCH', url, data });
  },
};
