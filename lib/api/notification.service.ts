import { api, notifsClient } from './client';
import { PaginatedResponse, PaginationParams } from '@/lib/types/api';
import {
	NotificationCampaign,
	NotificationLog,
	NotificationTemplate,
	CreateCampaignRequest,
	UpdateCampaignRequest,
	SendNotificationRequest,
} from '@/lib/types/notifications';

/**
 * Notification Service API Client
 * Connects to Notifications Service (:8085)
 * Handles campaigns, templates, and notification logs
 */
export const notificationService = {
	// ==================== Campaigns ====================

	/**
	 * List notification campaigns
	 * GET /api/v1/admin/notifications/campaigns
	 */
	getCampaigns: async (
		params?: PaginationParams & {
			status?: string;
			channel?: string;
		}
	): Promise<PaginatedResponse<NotificationCampaign>> => {
		return api.get<PaginatedResponse<NotificationCampaign>>(
			notifsClient,
			'/api/v1/admin/notifications/campaigns',
			params
		);
	},

	/**
	 * Get campaign by ID
	 * GET /api/v1/admin/notifications/campaigns/:id
	 */
	getCampaign: async (campaignId: string): Promise<NotificationCampaign> => {
		return api.get<NotificationCampaign>(notifsClient, `/api/v1/admin/notifications/campaigns/${campaignId}`);
	},

	/**
	 * Create a new campaign
	 * POST /api/v1/admin/notifications/campaigns
	 */
	createCampaign: async (data: CreateCampaignRequest): Promise<NotificationCampaign> => {
		return api.post<NotificationCampaign>(notifsClient, '/api/v1/admin/notifications/campaigns', data);
	},

	/**
	 * Update a campaign
	 * PUT /api/v1/admin/notifications/campaigns/:id
	 */
	updateCampaign: async (campaignId: string, data: UpdateCampaignRequest): Promise<NotificationCampaign> => {
		return api.put<NotificationCampaign>(notifsClient, `/api/v1/admin/notifications/campaigns/${campaignId}`, data);
	},

	/**
	 * Send/launch a campaign immediately
	 * POST /api/v1/admin/notifications/campaigns/:id/send
	 */
	sendCampaign: async (campaignId: string): Promise<NotificationCampaign> => {
		return api.post<NotificationCampaign>(notifsClient, `/api/v1/admin/notifications/campaigns/${campaignId}/send`);
	},

	/**
	 * Cancel a scheduled campaign
	 * POST /api/v1/admin/notifications/campaigns/:id/cancel
	 */
	cancelCampaign: async (campaignId: string): Promise<NotificationCampaign> => {
		return api.post<NotificationCampaign>(notifsClient, `/api/v1/admin/notifications/campaigns/${campaignId}/cancel`);
	},

	/**
	 * Delete a draft campaign
	 * DELETE /api/v1/admin/notifications/campaigns/:id
	 */
	deleteCampaign: async (campaignId: string): Promise<void> => {
		return api.delete<void>(notifsClient, `/api/v1/admin/notifications/campaigns/${campaignId}`);
	},

	// ==================== Direct Notifications ====================

	/**
	 * Send a notification to a specific user
	 * POST /api/v1/admin/notifications/send
	 */
	sendNotification: async (data: SendNotificationRequest): Promise<NotificationLog> => {
		return api.post<NotificationLog>(notifsClient, '/api/v1/admin/notifications/send', data);
	},

	// ==================== Notification Logs ====================

	/**
	 * List notification logs
	 * GET /api/v1/admin/notifications/logs
	 */
	getLogs: async (
		params?: PaginationParams & {
			user_id?: string;
			channel?: string;
			status?: string;
			campaign_id?: string;
		}
	): Promise<PaginatedResponse<NotificationLog>> => {
		return api.get<PaginatedResponse<NotificationLog>>(notifsClient, '/api/v1/admin/notifications/logs', params);
	},

	// ==================== Templates ====================

	/**
	 * List notification templates
	 * GET /api/v1/admin/notifications/templates
	 */
	getTemplates: async (params?: PaginationParams): Promise<PaginatedResponse<NotificationTemplate>> => {
		return api.get<PaginatedResponse<NotificationTemplate>>(
			notifsClient,
			'/api/v1/admin/notifications/templates',
			params
		);
	},

	/**
	 * Create a template
	 * POST /api/v1/admin/notifications/templates
	 */
	createTemplate: async (data: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationTemplate> => {
		return api.post<NotificationTemplate>(notifsClient, '/api/v1/admin/notifications/templates', data);
	},

	/**
	 * Update a template
	 * PUT /api/v1/admin/notifications/templates/:id
	 */
	updateTemplate: async (
		templateId: string,
		data: Partial<Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>>
	): Promise<NotificationTemplate> => {
		return api.put<NotificationTemplate>(notifsClient, `/api/v1/admin/notifications/templates/${templateId}`, data);
	},

	/**
	 * Delete a template
	 * DELETE /api/v1/admin/notifications/templates/:id
	 */
	deleteTemplate: async (templateId: string): Promise<void> => {
		return api.delete<void>(notifsClient, `/api/v1/admin/notifications/templates/${templateId}`);
	},
};
