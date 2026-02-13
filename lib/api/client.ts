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

const errorInterceptor = async (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const statusCode = error.response?.status;
    const rawError = error.response?.data?.error;
    const message = (typeof rawError === 'string' ? rawError : error.response?.data?.message || error.message) || 'An error occurred';

    // Handle 401 Unauthorized - token expired or invalid
    if (statusCode === 401) {
      removeToken();

      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
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
  }

  throw new ApiError('An unexpected error occurred');
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
  client.interceptors.response.use(responseInterceptor, errorInterceptor);

  return client;
};

// API client instances for each service
export const authClient = createApiClient(
  process.env.NEXT_PUBLIC_AUTH_API_BASE_URL || 'http://localhost:8081'
);

export const adminClient = createApiClient(
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:8088'
);

export const analyticsClient = createApiClient(
  process.env.NEXT_PUBLIC_ANALYTICS_API_BASE_URL || 'http://localhost:8091'
);

export const fraudClient = createApiClient(
  process.env.NEXT_PUBLIC_FRAUD_API_BASE_URL || 'http://localhost:8092'
);

export const promosClient = createApiClient(
  process.env.NEXT_PUBLIC_PROMOS_API_BASE_URL || 'http://localhost:8089'
);

export const notifsClient = createApiClient(
  process.env.NEXT_PUBLIC_NOTIFS_API_BASE_URL || 'http://localhost:8085'
);

export const mlEtaClient = createApiClient(
  process.env.NEXT_PUBLIC_ML_ETA_API_BASE_URL || 'http://localhost:8093'
);

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
