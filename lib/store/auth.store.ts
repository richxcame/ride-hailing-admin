import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService } from '@/lib/api/auth.service';
import { setToken, removeToken } from '@/lib/api/client';
import { LoginRequest, AuthResponse } from '@/lib/types/api';
import { User } from '@/lib/types/models';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Login action
        login: async (credentials: LoginRequest) => {
          set({ isLoading: true, error: null });

          try {
            const response: AuthResponse = await authService.login(credentials);

            // Check if user has admin role
            if (response.user.role !== 'admin') {
              throw new Error('Access denied. Admin privileges required.');
            }

            // Store JWT token in cookie
            setToken(response.token);

            // Update state with user data
            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Login failed';
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
            });
            throw error;
          }
        },

        // Logout action
        logout: () => {
          // Remove JWT token from cookie
          removeToken();

          // Clear state
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        },

        // Load user profile (for rehydration)
        loadUser: async () => {
          set({ isLoading: true, error: null });

          try {
            const user = await authService.getProfile();

            // Verify admin role
            if (user.role !== 'admin') {
              throw new Error('Access denied. Admin privileges required.');
            }

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load user';

            // If loading user fails, clear auth state
            removeToken();
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: errorMessage,
            });
          }
        },

        // Update user profile
        updateUser: async (data: Partial<User>) => {
          set({ isLoading: true, error: null });

          try {
            const updatedUser = await authService.updateProfile(data);

            set({
              user: updatedUser,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Failed to update profile';
            set({
              isLoading: false,
              error: errorMessage,
            });
            throw error;
          }
        },

        // Clear error
        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'auth-storage', // unique name for localStorage key
        partialize: (state) => ({
          // Only persist user and isAuthenticated
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'AuthStore', // name for devtools
    }
  )
);

// Selectors for better performance
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectError = (state: AuthState) => state.error;
