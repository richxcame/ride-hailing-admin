import { api, authClient } from './client';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '@/lib/types/api';
import { User } from '@/lib/types/models';

/**
 * Auth Service API Client
 * Connects to Auth Service (:8081)
 */
export const authService = {
  /**
   * Login with email and password
   * POST /api/v1/auth/login
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return api.post<AuthResponse>(authClient, '/api/v1/auth/login', credentials);
  },

  /**
   * Register a new user account
   * POST /api/v1/auth/register
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return api.post<AuthResponse>(authClient, '/api/v1/auth/register', data);
  },

  /**
   * Get current user profile
   * GET /api/v1/auth/profile
   * Requires authentication
   */
  getProfile: async (): Promise<User> => {
    return api.get<User>(authClient, '/api/v1/auth/profile');
  },

  /**
   * Update current user profile
   * PUT /api/v1/auth/profile
   * Requires authentication
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    return api.put<User>(authClient, '/api/v1/auth/profile', data);
  },
};
