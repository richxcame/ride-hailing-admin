import { api, adminClient } from './client';
import { PaginatedResponse, PaginationParams } from '@/lib/types/api';
import {
	PricingConfigVersion,
	PricingConfig,
	SurgeThreshold,
	TimeMultiplier,
	WeatherMultiplier,
	EventMultiplier,
	ZoneFee,
	PricingPreviewResult,
	CreatePricingVersionRequest,
	UpdatePricingVersionRequest,
	CreatePricingConfigRequest,
	UpdatePricingConfigRequest,
	PricingPreviewRequest,
	PricingAuditLog,
} from '@/lib/types/pricing';

const BASE = '/api/v1/admin/pricing';

export const pricingService = {
	// ==================== Versions ====================

	getVersions: async (
		params?: PaginationParams & { status?: string }
	): Promise<PaginatedResponse<PricingConfigVersion>> => {
		return api.get<PaginatedResponse<PricingConfigVersion>>(
			adminClient,
			`${BASE}/versions`,
			params
		);
	},

	getVersion: async (id: string): Promise<PricingConfigVersion> => {
		return api.get<PricingConfigVersion>(adminClient, `${BASE}/versions/${id}`);
	},

	createVersion: async (data: CreatePricingVersionRequest): Promise<PricingConfigVersion> => {
		return api.post<PricingConfigVersion>(adminClient, `${BASE}/versions`, data);
	},

	updateVersion: async (
		id: string,
		data: UpdatePricingVersionRequest
	): Promise<PricingConfigVersion> => {
		return api.put<PricingConfigVersion>(adminClient, `${BASE}/versions/${id}`, data);
	},

	activateVersion: async (id: string): Promise<PricingConfigVersion> => {
		return api.post<PricingConfigVersion>(adminClient, `${BASE}/versions/${id}/activate`);
	},

	archiveVersion: async (id: string): Promise<PricingConfigVersion> => {
		return api.post<PricingConfigVersion>(adminClient, `${BASE}/versions/${id}/archive`);
	},

	cloneVersion: async (id: string): Promise<PricingConfigVersion> => {
		return api.post<PricingConfigVersion>(adminClient, `${BASE}/versions/${id}/clone`);
	},

	// ==================== Configs (scoped to version) ====================

	getConfigs: async (
		versionId: string,
		params?: PaginationParams & {
			level?: string;
			country_id?: string;
			region_id?: string;
			city_id?: string;
			zone_id?: string;
		}
	): Promise<PaginatedResponse<PricingConfig>> => {
		return api.get<PaginatedResponse<PricingConfig>>(
			adminClient,
			`${BASE}/versions/${versionId}/configs`,
			params
		);
	},

	getConfig: async (id: string): Promise<PricingConfig> => {
		return api.get<PricingConfig>(adminClient, `${BASE}/configs/${id}`);
	},

	createConfig: async (
		versionId: string,
		data: CreatePricingConfigRequest
	): Promise<PricingConfig> => {
		return api.post<PricingConfig>(
			adminClient,
			`${BASE}/versions/${versionId}/configs`,
			data
		);
	},

	updateConfig: async (id: string, data: UpdatePricingConfigRequest): Promise<PricingConfig> => {
		return api.put<PricingConfig>(adminClient, `${BASE}/configs/${id}`, data);
	},

	deleteConfig: async (id: string): Promise<void> => {
		return api.delete<void>(adminClient, `${BASE}/configs/${id}`);
	},

	// ==================== Surge Thresholds (scoped to version) ====================

	getSurgeThresholds: async (
		versionId: string,
		params?: PaginationParams & {
			country_id?: string;
			region_id?: string;
			city_id?: string;
		}
	): Promise<PaginatedResponse<SurgeThreshold>> => {
		return api.get<PaginatedResponse<SurgeThreshold>>(
			adminClient,
			`${BASE}/versions/${versionId}/surge-thresholds`,
			params
		);
	},

	createSurgeThreshold: async (
		versionId: string,
		data: Omit<SurgeThreshold, 'id' | 'created_at' | 'updated_at'>
	): Promise<SurgeThreshold> => {
		return api.post<SurgeThreshold>(
			adminClient,
			`${BASE}/versions/${versionId}/surge-thresholds`,
			data
		);
	},

	updateSurgeThreshold: async (
		id: string,
		data: Partial<SurgeThreshold>
	): Promise<SurgeThreshold> => {
		return api.put<SurgeThreshold>(adminClient, `${BASE}/surge-thresholds/${id}`, data);
	},

	deleteSurgeThreshold: async (id: string): Promise<void> => {
		return api.delete<void>(adminClient, `${BASE}/surge-thresholds/${id}`);
	},

	// ==================== Time Multipliers (scoped to version) ====================

	getTimeMultipliers: async (
		versionId: string,
		params?: PaginationParams & {
			country_id?: string;
			region_id?: string;
			city_id?: string;
		}
	): Promise<PaginatedResponse<TimeMultiplier>> => {
		return api.get<PaginatedResponse<TimeMultiplier>>(
			adminClient,
			`${BASE}/versions/${versionId}/time-multipliers`,
			params
		);
	},

	createTimeMultiplier: async (
		versionId: string,
		data: Omit<TimeMultiplier, 'id' | 'created_at' | 'updated_at'>
	): Promise<TimeMultiplier> => {
		return api.post<TimeMultiplier>(
			adminClient,
			`${BASE}/versions/${versionId}/time-multipliers`,
			data
		);
	},

	updateTimeMultiplier: async (
		id: string,
		data: Partial<TimeMultiplier>
	): Promise<TimeMultiplier> => {
		return api.put<TimeMultiplier>(adminClient, `${BASE}/time-multipliers/${id}`, data);
	},

	deleteTimeMultiplier: async (id: string): Promise<void> => {
		return api.delete<void>(adminClient, `${BASE}/time-multipliers/${id}`);
	},

	// ==================== Weather Multipliers (scoped to version) ====================

	getWeatherMultipliers: async (
		versionId: string,
		params?: PaginationParams & {
			country_id?: string;
			region_id?: string;
			city_id?: string;
		}
	): Promise<PaginatedResponse<WeatherMultiplier>> => {
		return api.get<PaginatedResponse<WeatherMultiplier>>(
			adminClient,
			`${BASE}/versions/${versionId}/weather-multipliers`,
			params
		);
	},

	createWeatherMultiplier: async (
		versionId: string,
		data: Omit<WeatherMultiplier, 'id' | 'created_at' | 'updated_at'>
	): Promise<WeatherMultiplier> => {
		return api.post<WeatherMultiplier>(
			adminClient,
			`${BASE}/versions/${versionId}/weather-multipliers`,
			data
		);
	},

	updateWeatherMultiplier: async (
		id: string,
		data: Partial<WeatherMultiplier>
	): Promise<WeatherMultiplier> => {
		return api.put<WeatherMultiplier>(adminClient, `${BASE}/weather-multipliers/${id}`, data);
	},

	deleteWeatherMultiplier: async (id: string): Promise<void> => {
		return api.delete<void>(adminClient, `${BASE}/weather-multipliers/${id}`);
	},

	// ==================== Event Multipliers (scoped to version) ====================

	getEventMultipliers: async (
		versionId: string,
		params?: PaginationParams & {
			country_id?: string;
			region_id?: string;
			city_id?: string;
		}
	): Promise<PaginatedResponse<EventMultiplier>> => {
		return api.get<PaginatedResponse<EventMultiplier>>(
			adminClient,
			`${BASE}/versions/${versionId}/event-multipliers`,
			params
		);
	},

	createEventMultiplier: async (
		versionId: string,
		data: Omit<EventMultiplier, 'id' | 'created_at' | 'updated_at'>
	): Promise<EventMultiplier> => {
		return api.post<EventMultiplier>(
			adminClient,
			`${BASE}/versions/${versionId}/event-multipliers`,
			data
		);
	},

	updateEventMultiplier: async (
		id: string,
		data: Partial<EventMultiplier>
	): Promise<EventMultiplier> => {
		return api.put<EventMultiplier>(adminClient, `${BASE}/event-multipliers/${id}`, data);
	},

	deleteEventMultiplier: async (id: string): Promise<void> => {
		return api.delete<void>(adminClient, `${BASE}/event-multipliers/${id}`);
	},

	// ==================== Zone Fees (scoped to version) ====================

	getZoneFees: async (
		versionId: string,
		params?: PaginationParams & { zone_id?: string }
	): Promise<PaginatedResponse<ZoneFee>> => {
		return api.get<PaginatedResponse<ZoneFee>>(
			adminClient,
			`${BASE}/versions/${versionId}/zone-fees`,
			params
		);
	},

	createZoneFee: async (
		versionId: string,
		data: Omit<ZoneFee, 'id' | 'created_at' | 'updated_at'>
	): Promise<ZoneFee> => {
		return api.post<ZoneFee>(
			adminClient,
			`${BASE}/versions/${versionId}/zone-fees`,
			data
		);
	},

	updateZoneFee: async (id: string, data: Partial<ZoneFee>): Promise<ZoneFee> => {
		return api.put<ZoneFee>(adminClient, `${BASE}/zone-fees/${id}`, data);
	},

	deleteZoneFee: async (id: string): Promise<void> => {
		return api.delete<void>(adminClient, `${BASE}/zone-fees/${id}`);
	},

	// ==================== Audit Logs ====================

	getAuditLogs: async (
		params?: PaginationParams & {
			entity_type?: string;
			entity_id?: string;
		}
	): Promise<PaginatedResponse<PricingAuditLog>> => {
		return api.get<PaginatedResponse<PricingAuditLog>>(
			adminClient,
			`${BASE}/audit-logs`,
			params
		);
	},

	// ==================== Preview (not yet in backend) ====================

	previewPricing: async (data: PricingPreviewRequest): Promise<PricingPreviewResult> => {
		return api.post<PricingPreviewResult>(adminClient, `${BASE}/preview`, data);
	},
};
