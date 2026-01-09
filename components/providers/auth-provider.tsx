'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getToken } from '@/lib/api/client';

interface AuthProviderProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = ['/login'];

/**
 * Auth Provider Component
 * - Loads user profile on mount if token exists
 * - Protects routes that require authentication
 * - Redirects to login if unauthenticated
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, loadUser, logout } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();

      if (token) {
        try {
          await loadUser();
        } catch (error) {
          console.error('Failed to load user:', error);
          logout();
        }
      }

      setIsInitialized(true);
    };

    initAuth();
  }, []);

  // Redirect logic after initialization
  useEffect(() => {
    if (!isInitialized) return;

    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

    // Redirect to dashboard if authenticated and on login page
    if (isAuthenticated && isPublicRoute) {
      router.replace('/dashboard');
      return;
    }

    // Redirect to login if not authenticated and not on public route
    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
      return;
    }
  }, [isAuthenticated, isInitialized, pathname, router]);

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
