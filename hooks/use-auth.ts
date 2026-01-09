import { useAuthStore } from '@/lib/store/auth.store';
import { LoginRequest } from '@/lib/types/api';
import { User } from '@/lib/types/models';

/**
 * Custom hook for authentication
 * Provides easy access to auth state and actions
 */
export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    loadUser,
    updateUser,
    clearError,
  } = useAuthStore();

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Computed
    isAdmin: user?.role === 'admin',

    // Actions
    login: async (credentials: LoginRequest) => {
      await login(credentials);
    },
    logout: () => {
      logout();
    },
    loadUser: async () => {
      await loadUser();
    },
    updateUser: async (data: Partial<User>) => {
      await updateUser(data);
    },
    clearError: () => {
      clearError();
    },
  };
}
