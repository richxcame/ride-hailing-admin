import { api, authClient } from './client';
import { LoginRequest, AuthResponse } from '@/lib/types/api';
import { User } from '@/lib/types/models';

/**
 * Auth Service API Client
 * Connects to Auth Service (:8081)
 *
 * Note: the auth service is phone-OTP-first for riders/drivers. Admin/staff
 * accounts authenticate via the dedicated email + password endpoint below.
 */
export const authService = {
  /**
   * Log in an admin/staff account with email and password.
   * POST /api/v1/auth/admin/login
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return api.post<AuthResponse>(authClient, '/api/v1/auth/admin/login', credentials);
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
