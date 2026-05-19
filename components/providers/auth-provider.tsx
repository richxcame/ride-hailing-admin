'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getToken, getRefreshToken } from '@/lib/api/client';

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

  // Keep the latest auth actions without re-running the init effect,
  // since useAuth() returns new function references on every render.
  const loadUserRef = useRef(loadUser);
  const logoutRef = useRef(logout);

  useEffect(() => {
    loadUserRef.current = loadUser;
    logoutRef.current = logout;
  }, [loadUser, logout]);

  useEffect(() => {
    const initAuth = async () => {
      // Load the user if we have an access token, or only a refresh token —
      // in the latter case the 401 interceptor silently renews the session.
      if (getToken() || getRefreshToken()) {
        try {
          await loadUserRef.current();
        } catch (error) {
          console.error('Failed to load user:', error);
          logoutRef.current();
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
