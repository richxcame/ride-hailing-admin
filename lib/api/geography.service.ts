import { api, adminClient } from './client';
import { PaginatedResponse, PaginationParams } from '@/lib/types/api';
import {
	Country,
	Region,
	City,
	PricingZone,
	GeoStats,
	CreateCountryRequest,
	UpdateCountryRequest,
	CreateRegionRequest,
	UpdateRegionRequest,
	CreateCityRequest,
	UpdateCityRequest,
	CreatePricingZoneRequest,
	UpdatePricingZoneRequest,
} from '@/lib/types/geography';

const BASE = '/api/v1/admin/geography';

export const geographyService = {
	// ==================== Stats ====================

	getStats: async (): Promise<GeoStats> => {
		return api.get<GeoStats>(adminClient, `${BASE}/stats`);
	},

	// ==================== Countries ====================

	getCountries: async (
		params?: PaginationParams & { search?: string }
	): Promise<PaginatedResponse<Country>> => {
		return api.get<PaginatedResponse<Country>>(adminClient, `${BASE}/countries`, params);
	},

	getCountry: async (id: string): Promise<Country> => {
		return api.get<Country>(adminClient, `${BASE}/countries/${id}`);
	},

	createCountry: async (data: CreateCountryRequest): Promise<Country> => {
		return api.post<Country>(adminClient, `${BASE}/countries`, data);
	},

	updateCountry: async (id: string, data: UpdateCountryRequest): Promise<Country> => {
		return api.put<Country>(adminClient, `${BASE}/countries/${id}`, data);
	},

	deleteCountry: async (id: string): Promise<void> => {
		return api.delete<void>(adminClient, `${BASE}/countries/${id}`);
	},

	// ==================== Regions ====================

	getRegions: async (
		countryId: string,
		params?: PaginationParams & { search?: string }
	): Promise<PaginatedResponse<Region>> => {
		return api.get<PaginatedResponse<Region>>(
			adminClient,
			`${BASE}/countries/${countryId}/regions`,
			params
		);
	},

	getRegion: async (id: string): Promise<Region> => {
		return api.get<Region>(adminClient, `${BASE}/regions/${id}`);
	},

	createRegion: async (countryId: string, data: CreateRegionRequest): Promise<Region> => {
		return api.post<Region>(adminClient, `${BASE}/countries/${countryId}/regions`, data);
	},

	updateRegion: async (id: string, data: UpdateRegionRequest): Promise<Region> => {
		return api.put<Region>(adminClient, `${BASE}/regions/${id}`, data);
	},

	deleteRegion: async (id: string): Promise<void> => {
		return api.delete<void>(adminClient, `${BASE}/regions/${id}`);
	},

	// ==================== Cities ====================

	getCities: async (
		regionId: string,
		params?: PaginationParams & { search?: string }
	): Promise<PaginatedResponse<City>> => {
		return api.get<PaginatedResponse<City>>(
			adminClient,
			`${BASE}/regions/${regionId}/cities`,
			params
		);
	},

	getCity: async (id: string): Promise<City> => {
		return api.get<City>(adminClient, `${BASE}/cities/${id}`);
	},

	createCity: async (regionId: string, data: CreateCityRequest): Promise<City> => {
		return api.post<City>(adminClient, `${BASE}/regions/${regionId}/cities`, data);
	},

	updateCity: async (id: string, data: UpdateCityRequest): Promise<City> => {
		return api.put<City>(adminClient, `${BASE}/cities/${id}`, data);
	},

	deleteCity: async (id: string): Promise<void> => {
		return api.delete<void>(adminClient, `${BASE}/cities/${id}`);
	},

	// ==================== Pricing Zones ====================

	getZones: async (
		cityId: string,
		params?: PaginationParams & { search?: string }
	): Promise<PaginatedResponse<PricingZone>> => {
		return api.get<PaginatedResponse<PricingZone>>(
			adminClient,
			`${BASE}/cities/${cityId}/zones`,
			params
		);
	},

	getZone: async (id: string): Promise<PricingZone> => {
		return api.get<PricingZone>(adminClient, `${BASE}/zones/${id}`);
	},

	createZone: async (cityId: string, data: CreatePricingZoneRequest): Promise<PricingZone> => {
		return api.post<PricingZone>(adminClient, `${BASE}/cities/${cityId}/zones`, data);
	},

	updateZone: async (id: string, data: UpdatePricingZoneRequest): Promise<PricingZone> => {
		return api.put<PricingZone>(adminClient, `${BASE}/zones/${id}`, data);
	},

	deleteZone: async (id: string): Promise<void> => {
		return api.delete<void>(adminClient, `${BASE}/zones/${id}`);
	},
};
