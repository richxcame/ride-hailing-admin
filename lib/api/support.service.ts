import { api, adminClient } from './client';
import { PaginatedResponse, PaginationParams } from '@/lib/types/api';
import {
	SupportTicket,
	TicketMessage,
	Dispute,
	CancellationRecord,
	CancellationStats,
	CreateTicketRequest,
	UpdateTicketRequest,
	ReplyTicketRequest,
	ResolveDisputeRequest,
	WaiveCancellationFeeRequest,
} from '@/lib/types/support';

/**
 * Support Service API Client
 * Connects to Admin Service (:8088)
 * Handles support tickets, disputes, and cancellations
 */
export const supportService = {
	// ==================== Support Tickets ====================

	/**
	 * List support tickets
	 * GET /api/v1/admin/support/tickets
	 */
	getTickets: async (
		params?: PaginationParams & {
			status?: string;
			priority?: string;
			category?: string;
			assigned_to?: string;
			search?: string;
		}
	): Promise<PaginatedResponse<SupportTicket>> => {
		return api.get<PaginatedResponse<SupportTicket>>(adminClient, '/api/v1/admin/support/tickets', params);
	},

	/**
	 * Get ticket by ID
	 * GET /api/v1/admin/support/tickets/:id
	 */
	getTicket: async (ticketId: string): Promise<SupportTicket> => {
		return api.get<SupportTicket>(adminClient, `/api/v1/admin/support/tickets/${ticketId}`);
	},

	/**
	 * Create a new ticket
	 * POST /api/v1/admin/support/tickets
	 */
	createTicket: async (data: CreateTicketRequest): Promise<SupportTicket> => {
		return api.post<SupportTicket>(adminClient, '/api/v1/admin/support/tickets', data);
	},

	/**
	 * Update a ticket
	 * PUT /api/v1/admin/support/tickets/:id
	 */
	updateTicket: async (ticketId: string, data: UpdateTicketRequest): Promise<SupportTicket> => {
		return api.put<SupportTicket>(adminClient, `/api/v1/admin/support/tickets/${ticketId}`, data);
	},

	/**
	 * Get ticket messages
	 * GET /api/v1/admin/support/tickets/:id/messages
	 */
	getTicketMessages: async (ticketId: string): Promise<TicketMessage[]> => {
		return api.get<TicketMessage[]>(adminClient, `/api/v1/admin/support/tickets/${ticketId}/messages`);
	},

	/**
	 * Reply to a ticket
	 * POST /api/v1/admin/support/tickets/:id/reply
	 */
	replyToTicket: async (ticketId: string, data: ReplyTicketRequest): Promise<TicketMessage> => {
		return api.post<TicketMessage>(adminClient, `/api/v1/admin/support/tickets/${ticketId}/reply`, data);
	},

	/**
	 * Close a ticket
	 * POST /api/v1/admin/support/tickets/:id/close
	 */
	closeTicket: async (ticketId: string, data?: { resolution?: string }): Promise<SupportTicket> => {
		return api.post<SupportTicket>(adminClient, `/api/v1/admin/support/tickets/${ticketId}/close`, data);
	},

	// ==================== Disputes ====================

	/**
	 * List disputes
	 * GET /api/v1/admin/disputes
	 */
	getDisputes: async (
		params?: PaginationParams & {
			status?: string;
			search?: string;
		}
	): Promise<PaginatedResponse<Dispute>> => {
		return api.get<PaginatedResponse<Dispute>>(adminClient, '/api/v1/admin/disputes', params);
	},

	/**
	 * Get dispute by ID
	 * GET /api/v1/admin/disputes/:id
	 */
	getDispute: async (disputeId: string): Promise<Dispute> => {
		return api.get<Dispute>(adminClient, `/api/v1/admin/disputes/${disputeId}`);
	},

	/**
	 * Start reviewing a dispute
	 * POST /api/v1/admin/disputes/:id/review
	 */
	reviewDispute: async (disputeId: string): Promise<Dispute> => {
		return api.post<Dispute>(adminClient, `/api/v1/admin/disputes/${disputeId}/review`);
	},

	/**
	 * Resolve a dispute
	 * POST /api/v1/admin/disputes/:id/resolve
	 */
	resolveDispute: async (disputeId: string, data: ResolveDisputeRequest): Promise<Dispute> => {
		return api.post<Dispute>(adminClient, `/api/v1/admin/disputes/${disputeId}/resolve`, data);
	},

	/**
	 * Reject a dispute
	 * POST /api/v1/admin/disputes/:id/reject
	 */
	rejectDispute: async (disputeId: string, data: { reason: string }): Promise<Dispute> => {
		return api.post<Dispute>(adminClient, `/api/v1/admin/disputes/${disputeId}/reject`, data);
	},

	/**
	 * Escalate a dispute
	 * POST /api/v1/admin/disputes/:id/escalate
	 */
	escalateDispute: async (disputeId: string, data?: { notes?: string }): Promise<Dispute> => {
		return api.post<Dispute>(adminClient, `/api/v1/admin/disputes/${disputeId}/escalate`, data);
	},

	// ==================== Cancellations ====================

	/**
	 * List cancellation records
	 * GET /api/v1/admin/cancellations
	 */
	getCancellations: async (
		params?: PaginationParams & {
			cancelled_by?: 'rider' | 'driver' | 'system';
			fee_waived?: boolean;
			search?: string;
		}
	): Promise<PaginatedResponse<CancellationRecord>> => {
		return api.get<PaginatedResponse<CancellationRecord>>(adminClient, '/api/v1/admin/cancellations', params);
	},

	/**
	 * Get cancellation statistics
	 * GET /api/v1/admin/cancellations/stats
	 */
	getCancellationStats: async (params?: {
		start_date?: string;
		end_date?: string;
	}): Promise<CancellationStats> => {
		return api.get<CancellationStats>(adminClient, '/api/v1/admin/cancellations/stats', params);
	},

	/**
	 * Waive a cancellation fee
	 * POST /api/v1/admin/cancellations/:id/waive
	 */
	waiveCancellationFee: async (cancellationId: string, data: WaiveCancellationFeeRequest): Promise<CancellationRecord> => {
		return api.post<CancellationRecord>(adminClient, `/api/v1/admin/cancellations/${cancellationId}/waive`, data);
	},

	/**
	 * Get cancellations for a specific user
	 * GET /api/v1/admin/users/:user_id/cancellations
	 */
	getUserCancellations: async (
		userId: string,
		params?: PaginationParams
	): Promise<PaginatedResponse<CancellationRecord>> => {
		return api.get<PaginatedResponse<CancellationRecord>>(
			adminClient,
			`/api/v1/admin/users/${userId}/cancellations`,
			params
		);
	},
};
