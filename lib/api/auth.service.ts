import { api, adminClient } from './client';
import { LoginRequest, AuthResponse } from '@/lib/types/api';
import { User } from '@/lib/types/models';

/**
 * Auth Service API Client
 *
 * The auth handler is mounted on admin-service in-process; the standalone
 * cmd/auth service exists for a possible future split but isn't deployed.
 * For riders/drivers auth is phone-OTP-first — admin/staff use the dedicated
 * email + password endpoint below.
 */
export const authService = {
  /**
   * Log in an admin/staff account with email and password.
   * POST /api/v1/auth/admin/login
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return api.post<AuthResponse>(adminClient, '/api/v1/auth/admin/login', credentials);
  },

  /**
   * Get current user profile
   * GET /api/v1/auth/profile
   * Requires authentication
   */
  getProfile: async (): Promise<User> => {
    return api.get<User>(adminClient, '/api/v1/auth/profile');
  },

  /**
   * Update current user profile
   * PUT /api/v1/auth/profile
   * Requires authentication
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    return api.put<User>(adminClient, '/api/v1/auth/profile', data);
  },
};
