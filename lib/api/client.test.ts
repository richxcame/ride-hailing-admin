/**
 * Tests for the API client's cookie + session helpers and the apiRequest
 * envelope unwrap.
 *
 * The full 401-refresh-and-retry interceptor flow is covered indirectly by
 * the auth store integration tests; here we lock in the low-level token
 * helpers since the auth store depends on them.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Cookies from 'js-cookie';
import type { AxiosInstance } from 'axios';

import {
	getToken,
	setToken,
	removeToken,
	getRefreshToken,
	setRefreshToken,
	removeRefreshToken,
	clearSession,
	apiRequest,
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

describe('apiRequest meta normalization', () => {
	// Build a fake axios client where .request() returns whatever we feed it.
	const makeClient = (responseData: unknown): AxiosInstance =>
		({
			request: vi.fn().mockResolvedValue({ data: responseData }),
		}) as unknown as AxiosInstance;

	it('returns total/limit/offset as numbers even when the backend omits them on empty results', async () => {
		// Go's `omitempty` strips zero-valued numeric fields, so an empty list
		// arrives as `meta: {}`. apiRequest must fill in zeros.
		const client = makeClient({
			success: true,
			data: [],
			meta: {},
		});

		const result = await apiRequest<{
			data: unknown[];
			meta: { limit: number; offset: number; total: number; total_pages: number };
		}>(client, { method: 'GET', url: '/x' });

		expect(result.meta.total).toBe(0);
		expect(result.meta.limit).toBe(0);
		expect(result.meta.offset).toBe(0);
		expect(result.meta.total_pages).toBe(0);
	});

	it('preserves provided meta and derives total_pages when only total/limit are present', async () => {
		const client = makeClient({
			success: true,
			data: [1, 2, 3],
			meta: { limit: 20, offset: 0, total: 43 },
		});

		const result = await apiRequest<{
			data: number[];
			meta: { limit: number; offset: number; total: number; total_pages: number };
		}>(client, { method: 'GET', url: '/x' });

		expect(result.meta.total).toBe(43);
		expect(result.meta.limit).toBe(20);
		expect(result.meta.total_pages).toBe(3);
	});

	it('passes through a backend-supplied total_pages without recomputing', async () => {
		const client = makeClient({
			success: true,
			data: [],
			meta: { limit: 10, offset: 0, total: 100, total_pages: 10 },
		});

		const result = await apiRequest<{
			data: unknown[];
			meta: { total_pages: number };
		}>(client, { method: 'GET', url: '/x' });

		expect(result.meta.total_pages).toBe(10);
	});
});
