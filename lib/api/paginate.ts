import type { PaginatedResponse } from '@/lib/types/api';

/**
 * Paginated response with optional total tracking.
 *
 * Walks every page of a paginated endpoint and returns the full collection.
 * Use sparingly — only for small bounded sets (countries, ride types) where
 * we genuinely want everything at once for a picker.
 *
 * The backend caps `limit` at 100; we stop either when we've reached the
 * reported total or when a page returns fewer rows than requested.
 */
export async function fetchAllPages<T>(
	fetchPage: (offset: number, limit: number) => Promise<PaginatedResponse<T>>,
	options: { pageSize?: number; safetyLimit?: number } = {},
): Promise<T[]> {
	const pageSize = options.pageSize ?? 100;
	const safetyLimit = options.safetyLimit ?? 50; // max pages we'll ever walk

	const all: T[] = [];
	let offset = 0;
	for (let page = 0; page < safetyLimit; page += 1) {
		const res = await fetchPage(offset, pageSize);
		all.push(...res.data);

		const reachedTotal = res.meta.total > 0 && all.length >= res.meta.total;
		const shortPage = res.data.length < pageSize;
		if (reachedTotal || shortPage) {
			return all;
		}
		offset += pageSize;
	}
	return all;
}
