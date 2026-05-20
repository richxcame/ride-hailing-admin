import { api, adminClient } from './client';
import { PaginatedResponse, PaginationParams } from '@/lib/types/api';
import {
	DriverDocument,
	ReviewDocumentRequest,
} from '@/lib/types/documents';

/**
 * Documents Service API Client
 * Connects to Admin Service (:8088)
 * Handles driver document reviews and compliance
 */
export const documentsService = {
	/**
	 * List pending document reviews
	 * GET /api/v1/admin/documents/pending
	 */
	getPending: async (
		params?: PaginationParams & {
			type?: string;
		}
	): Promise<PaginatedResponse<DriverDocument>> => {
		return api.get<PaginatedResponse<DriverDocument>>(adminClient, '/api/v1/admin/documents/pending', params);
	},

	/**
	 * List expiring documents
	 * GET /api/v1/admin/documents/expiring
	 */
	getExpiring: async (
		params?: PaginationParams & {
			days?: number;
		}
	): Promise<PaginatedResponse<DriverDocument>> => {
		return api.get<PaginatedResponse<DriverDocument>>(adminClient, '/api/v1/admin/documents/expiring', params);
	},

	/**
	 * Get all documents (with filters)
	 * GET /api/v1/admin/documents
	 */
	getDocuments: async (
		params?: PaginationParams & {
			status?: string;
			type?: string;
			driver_id?: string;
		}
	): Promise<PaginatedResponse<DriverDocument>> => {
		return api.get<PaginatedResponse<DriverDocument>>(adminClient, '/api/v1/admin/documents', params);
	},

	/**
	 * Get a specific document
	 * GET /api/v1/admin/documents/:id
	 */
	getDocument: async (documentId: string): Promise<DriverDocument> => {
		return api.get<DriverDocument>(adminClient, `/api/v1/admin/documents/${documentId}`);
	},

	/**
	 * Review a document (approve/reject)
	 * POST /api/v1/admin/documents/:id/review
	 */
	reviewDocument: async (documentId: string, data: ReviewDocumentRequest): Promise<DriverDocument> => {
		return api.post<DriverDocument>(adminClient, `/api/v1/admin/documents/${documentId}/review`, data);
	},

	/**
	 * Get documents for a specific driver
	 * GET /api/v1/admin/documents/drivers/:driverId
	 */
	getDriverDocuments: async (
		driverId: string,
		params?: PaginationParams
	): Promise<PaginatedResponse<DriverDocument>> => {
		return api.get<PaginatedResponse<DriverDocument>>(
			adminClient,
			`/api/v1/admin/documents/drivers/${driverId}`,
			params
		);
	},
};
