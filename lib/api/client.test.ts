/**
 * Tests for the API client's cookie + session helpers.
 *
 * The full 401-refresh-and-retry interceptor flow is covered indirectly by
 * the auth store integration tests; here we lock in the low-level token
 * helpers since the auth store depends on them.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import Cookies from 'js-cookie';

import {
	getToken,
	setToken,
	removeToken,
	getRefreshToken,
	setRefreshToken,
	removeRefreshToken,
	clearSession,
} from '@/lib/api/client';

describe('cookie helpers', () => {
	beforeEach(() => {
		Cookies.remove('admin_token');
		Cookies.remove('admin_refresh_token');
	});

	it('round-trips the access token', () => {
		expect(getToken()).toBeUndefined();
		setToken('access-abc');
		expect(getToken()).toBe('access-abc');
		removeToken();
		expect(getToken()).toBeUndefined();
	});

	it('round-trips the refresh token under its own cookie', () => {
		expect(getRefreshToken()).toBeUndefined();
		setRefreshToken('refresh-xyz');
		expect(getRefreshToken()).toBe('refresh-xyz');
		// Setting the refresh token must NOT touch the access cookie.
		expect(getToken()).toBeUndefined();
		removeRefreshToken();
		expect(getRefreshToken()).toBeUndefined();
	});

	it('clearSession removes both cookies', () => {
		setToken('access-abc');
		setRefreshToken('refresh-xyz');
		clearSession();
		expect(getToken()).toBeUndefined();
		expect(getRefreshToken()).toBeUndefined();
	});
});
