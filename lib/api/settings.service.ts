import { api, adminClient } from './client';
import {
	AppSetting,
	UpdateSettingRequest,
	BulkUpdateSettingsRequest,
} from '@/lib/types/settings';

/**
 * Settings Service API Client
 * Connects to Admin Service (:8088)
 * Handles app configuration settings
 */
export const settingsService = {
	/**
	 * Get all settings
	 * GET /api/v1/admin/settings
	 */
	getSettings: async (params?: {
		category?: string;
	}): Promise<AppSetting[]> => {
		return api.get<AppSetting[]>(adminClient, '/api/v1/admin/settings', params);
	},

	/**
	 * Get a specific setting by key
	 * GET /api/v1/admin/settings/:key
	 */
	getSetting: async (key: string): Promise<AppSetting> => {
		return api.get<AppSetting>(adminClient, `/api/v1/admin/settings/${key}`);
	},

	/**
	 * Update a setting
	 * PUT /api/v1/admin/settings/:key
	 */
	updateSetting: async (key: string, data: UpdateSettingRequest): Promise<AppSetting> => {
		return api.put<AppSetting>(adminClient, `/api/v1/admin/settings/${key}`, data);
	},

	/**
	 * Bulk update settings
	 * PUT /api/v1/admin/settings
	 */
	bulkUpdateSettings: async (data: BulkUpdateSettingsRequest): Promise<AppSetting[]> => {
		return api.put<AppSetting[]>(adminClient, '/api/v1/admin/settings', data);
	},
};
