import { api, adminClient } from './client';
import { PaginatedResponse, PaginationParams, DateRangeFilter } from '@/lib/types/api';
import {
	DriverEarningsSummary,
	Payout,
	RideEarning,
	EarningsStats,
	CreatePayoutRequest,
	ProcessPayoutRequest,
	BulkPayoutRequest,
} from '@/lib/types/earnings';

/**
 * Earnings Service API Client
 * Connects to Admin Service (:8088)
 * Handles driver earnings and payouts
 */
export const earningsService = {
	// ==================== Driver Earnings ====================

	/**
	 * List driver earnings summaries
	 * GET /api/v1/admin/earnings/drivers
	 */
	getDriverEarnings: async (
		params?: PaginationParams & DateRangeFilter & {
			search?: string;
			sort_by?: 'total_earnings' | 'pending_payout' | 'total_rides';
			sort_order?: 'asc' | 'desc';
		}
	): Promise<PaginatedResponse<DriverEarningsSummary>> => {
		return api.get<PaginatedResponse<DriverEarningsSummary>>(adminClient, '/api/v1/admin/earnings/drivers', params);
	},

	/**
	 * Get a specific driver's earnings
	 * GET /api/v1/admin/earnings/drivers/:driver_id
	 */
	getDriverEarning: async (driverId: string): Promise<DriverEarningsSummary> => {
		return api.get<DriverEarningsSummary>(adminClient, `/api/v1/admin/earnings/drivers/${driverId}`);
	},

	/**
	 * Get earnings breakdown per ride for a driver
	 * GET /api/v1/admin/earnings/drivers/:driver_id/rides
	 */
	getDriverRideEarnings: async (
		driverId: string,
		params?: PaginationParams & DateRangeFilter
	): Promise<PaginatedResponse<RideEarning>> => {
		return api.get<PaginatedResponse<RideEarning>>(
			adminClient,
			`/api/v1/admin/earnings/drivers/${driverId}/rides`,
			params
		);
	},

	// ==================== Payouts ====================

	/**
	 * List all payouts
	 * GET /api/v1/admin/payouts
	 */
	getPayouts: async (
		params?: PaginationParams & {
			status?: string;
			driver_id?: string;
			method?: string;
			search?: string;
		}
	): Promise<PaginatedResponse<Payout>> => {
		return api.get<PaginatedResponse<Payout>>(adminClient, '/api/v1/admin/payouts', params);
	},

	/**
	 * Get payout by ID
	 * GET /api/v1/admin/payouts/:id
	 */
	getPayout: async (payoutId: string): Promise<Payout> => {
		return api.get<Payout>(adminClient, `/api/v1/admin/payouts/${payoutId}`);
	},

	/**
	 * Create a payout request
	 * POST /api/v1/admin/payouts
	 */
	createPayout: async (data: CreatePayoutRequest): Promise<Payout> => {
		return api.post<Payout>(adminClient, '/api/v1/admin/payouts', data);
	},

	/**
	 * Process a pending payout
	 * POST /api/v1/admin/payouts/:id/process
	 */
	processPayout: async (payoutId: string, data?: ProcessPayoutRequest): Promise<Payout> => {
		return api.post<Payout>(adminClient, `/api/v1/admin/payouts/${payoutId}/process`, data);
	},

	/**
	 * Mark payout as completed
	 * POST /api/v1/admin/payouts/:id/complete
	 */
	completePayout: async (payoutId: string, data?: { reference?: string }): Promise<Payout> => {
		return api.post<Payout>(adminClient, `/api/v1/admin/payouts/${payoutId}/complete`, data);
	},

	/**
	 * Mark payout as failed
	 * POST /api/v1/admin/payouts/:id/fail
	 */
	failPayout: async (payoutId: string, data: { reason: string }): Promise<Payout> => {
		return api.post<Payout>(adminClient, `/api/v1/admin/payouts/${payoutId}/fail`, data);
	},

	/**
	 * Put payout on hold
	 * POST /api/v1/admin/payouts/:id/hold
	 */
	holdPayout: async (payoutId: string, data?: { notes?: string }): Promise<Payout> => {
		return api.post<Payout>(adminClient, `/api/v1/admin/payouts/${payoutId}/hold`, data);
	},

	/**
	 * Process bulk payouts
	 * POST /api/v1/admin/payouts/bulk
	 */
	bulkPayout: async (data: BulkPayoutRequest): Promise<{
		total: number;
		successful: number;
		failed: number;
		payouts: Payout[];
	}> => {
		return api.post(adminClient, '/api/v1/admin/payouts/bulk', data);
	},

	// ==================== Statistics ====================

	/**
	 * Get earnings/payout statistics
	 * GET /api/v1/admin/earnings/stats
	 */
	getStats: async (params?: DateRangeFilter): Promise<EarningsStats> => {
		return api.get<EarningsStats>(adminClient, '/api/v1/admin/earnings/stats', params);
	},
};
