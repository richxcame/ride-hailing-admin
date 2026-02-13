import { api, adminClient } from './client';
import { PaginatedResponse, PaginationParams, DateRangeFilter } from '@/lib/types/api';
import {
	Transaction,
	PaymentStats,
	RefundRequest,
} from '@/lib/types/payments';

/**
 * Payments Service API Client
 * Connects to Admin Service (:8088)
 * Handles transaction listing, stats, and refunds
 */
export const paymentsService = {
	/**
	 * List transactions
	 * GET /api/v1/admin/payments
	 */
	getTransactions: async (
		params?: PaginationParams & DateRangeFilter & {
			status?: string;
			method?: string;
			rider_id?: string;
			driver_id?: string;
			search?: string;
		}
	): Promise<PaginatedResponse<Transaction>> => {
		return api.get<PaginatedResponse<Transaction>>(adminClient, '/api/v1/admin/payments', params);
	},

	/**
	 * Get transaction by ID
	 * GET /api/v1/admin/payments/:id
	 */
	getTransaction: async (transactionId: string): Promise<Transaction> => {
		return api.get<Transaction>(adminClient, `/api/v1/admin/payments/${transactionId}`);
	},

	/**
	 * Get payment statistics
	 * GET /api/v1/admin/payments/stats
	 */
	getStats: async (params?: DateRangeFilter): Promise<PaymentStats> => {
		return api.get<PaymentStats>(adminClient, '/api/v1/admin/payments/stats', params);
	},

	/**
	 * Process a refund
	 * POST /api/v1/admin/payments/:id/refund
	 */
	refund: async (transactionId: string, data: RefundRequest): Promise<Transaction> => {
		return api.post<Transaction>(adminClient, `/api/v1/admin/payments/${transactionId}/refund`, data);
	},
};
