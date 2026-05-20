/**
 * Tests for the Zustand auth store.
 *
 * Mocks the auth service + token helpers — we're testing the store's
 * orchestration (admin-role gate, session persistence, error handling), not
 * the HTTP layer underneath.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/api/auth.service', () => ({
	authService: {
		login: vi.fn(),
		getProfile: vi.fn(),
		updateProfile: vi.fn(),
	},
}));

vi.mock('@/lib/api/client', () => ({
	setToken: vi.fn(),
	setRefreshToken: vi.fn(),
	clearSession: vi.fn(),
}));

import { useAuthStore } from '@/lib/store/auth.store';
import { authService } from '@/lib/api/auth.service';
import { setToken, setRefreshToken, clearSession } from '@/lib/api/client';

const adminUser = {
	id: 'u1',
	email: 'admin@example.com',
	first_name: 'Ada',
	last_name: 'Admin',
	role: 'admin' as const,
	phone_number: '',
	is_active: true,
	is_verified: true,
	created_at: '2026-01-01T00:00:00Z',
	updated_at: '2026-01-01T00:00:00Z',
};

const riderUser = { ...adminUser, role: 'rider' as const };

function resetStore() {
	useAuthStore.setState({
		user: null,
		isAuthenticated: false,
		isLoading: false,
		error: null,
	});
}

describe('auth store', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetStore();
	});

	describe('login', () => {
		it('persists user + tokens and flips isAuthenticated on success', async () => {
			vi.mocked(authService.login).mockResolvedValueOnce({
				token: 'access-tok',
				refresh_token: 'refresh-tok',
				user: adminUser,
			});

			await useAuthStore
				.getState()
				.login({ email: 'admin@example.com', password: 'pw12345!' });

			const state = useAuthStore.getState();
			expect(state.isAuthenticated).toBe(true);
			expect(state.user).toEqual(adminUser);
			expect(state.error).toBeNull();
			expect(setToken).toHaveBeenCalledWith('access-tok');
			expect(setRefreshToken).toHaveBeenCalledWith('refresh-tok');
		});

		it('rejects non-admin roles and never stores their token', async () => {
			vi.mocked(authService.login).mockResolvedValueOnce({
				token: 'access-tok',
				refresh_token: 'refresh-tok',
				user: riderUser,
			});

			await expect(
				useAuthStore
					.getState()
					.login({ email: 'rider@example.com', password: 'pw12345!' }),
			).rejects.toThrow(/admin/i);

			const state = useAuthStore.getState();
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBeNull();
			expect(state.error).toMatch(/admin/i);
			expect(setToken).not.toHaveBeenCalled();
			expect(setRefreshToken).not.toHaveBeenCalled();
		});

		it('surfaces API errors and clears auth state', async () => {
			vi.mocked(authService.login).mockRejectedValueOnce(
				new Error('invalid credentials'),
			);

			await expect(
				useAuthStore
					.getState()
					.login({ email: 'admin@example.com', password: 'wrong' }),
			).rejects.toThrow('invalid credentials');

			const state = useAuthStore.getState();
			expect(state.isAuthenticated).toBe(false);
			expect(state.error).toBe('invalid credentials');
			expect(setToken).not.toHaveBeenCalled();
		});

		it('omits setRefreshToken when the backend doesn\'t return one', async () => {
			vi.mocked(authService.login).mockResolvedValueOnce({
				token: 'access-tok',
				user: adminUser,
			});

			await useAuthStore
				.getState()
				.login({ email: 'admin@example.com', password: 'pw12345!' });

			expect(setToken).toHaveBeenCalledWith('access-tok');
			expect(setRefreshToken).not.toHaveBeenCalled();
		});
	});

	describe('logout', () => {
		it('clears both cookies and resets state', () => {
			useAuthStore.setState({
				user: adminUser,
				isAuthenticated: true,
			});

			useAuthStore.getState().logout();

			expect(clearSession).toHaveBeenCalledTimes(1);
			const state = useAuthStore.getState();
			expect(state.user).toBeNull();
			expect(state.isAuthenticated).toBe(false);
		});
	});

	describe('loadUser', () => {
		it('marks authenticated on a valid admin profile', async () => {
			vi.mocked(authService.getProfile).mockResolvedValueOnce(adminUser);

			await useAuthStore.getState().loadUser();

			const state = useAuthStore.getState();
			expect(state.isAuthenticated).toBe(true);
			expect(state.user).toEqual(adminUser);
		});

		it('clears the session on profile-fetch failure', async () => {
			vi.mocked(authService.getProfile).mockRejectedValueOnce(
				new Error('unauthorized'),
			);

			await useAuthStore.getState().loadUser();

			expect(clearSession).toHaveBeenCalledTimes(1);
			const state = useAuthStore.getState();
			expect(state.isAuthenticated).toBe(false);
			expect(state.user).toBeNull();
		});

		it('rejects when the profile returns a non-admin role', async () => {
			vi.mocked(authService.getProfile).mockResolvedValueOnce(riderUser);

			await useAuthStore.getState().loadUser();

			expect(clearSession).toHaveBeenCalledTimes(1);
			const state = useAuthStore.getState();
			expect(state.isAuthenticated).toBe(false);
			expect(state.error).toMatch(/admin/i);
		});
	});

	describe('clearError', () => {
		it('only clears the error field', () => {
			useAuthStore.setState({
				user: adminUser,
				isAuthenticated: true,
				error: 'something',
			});

			useAuthStore.getState().clearError();

			const state = useAuthStore.getState();
			expect(state.error).toBeNull();
			expect(state.user).toEqual(adminUser);
			expect(state.isAuthenticated).toBe(true);
		});
	});
});
