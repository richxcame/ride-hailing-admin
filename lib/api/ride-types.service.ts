import { api, adminClient } from './client';
import { PaginatedResponse, PaginationParams } from '@/lib/types/api';
import {
	RideType,
	CountryRideTypeWithDetails,
	CityRideTypeWithDetails,
	CreateRideTypeRequest,
	UpdateRideTypeRequest,
	CountryRideTypeRequest,
	UpdateCountryRideTypeRequest,
	CityRideTypeRequest,
	UpdateCityRideTypeRequest,
} from '@/lib/types/ride-types';

const BASE = '/api/v1/admin';

export const rideTypesService = {
	// ==================== Global Ride Types ====================

	getRideTypes: async (
		params?: PaginationParams & { include_inactive?: boolean }
	): Promise<PaginatedResponse<RideType>> => {
		return api.get<PaginatedResponse<RideType>>(
			adminClient,
			`${BASE}/ride-types`,
			params
		);
	},

	getRideType: async (id: string): Promise<RideType> => {
		return api.get<RideType>(adminClient, `${BASE}/ride-types/${id}`);
	},

	createRideType: async (data: CreateRideTypeRequest): Promise<RideType> => {
		return api.post<RideType>(adminClient, `${BASE}/ride-types`, data);
	},

	updateRideType: async (id: string, data: UpdateRideTypeRequest): Promise<RideType> => {
		return api.put<RideType>(adminClient, `${BASE}/ride-types/${id}`, data);
	},

	deleteRideType: async (id: string): Promise<void> => {
		return api.delete<void>(adminClient, `${BASE}/ride-types/${id}`);
	},

	// ==================== Country Ride Types ====================

	getCountryRideTypes: async (
		countryId: string,
		params?: { include_inactive?: boolean }
	): Promise<CountryRideTypeWithDetails[]> => {
		return api.get<CountryRideTypeWithDetails[]>(
			adminClient,
			`${BASE}/countries/${countryId}/ride-types`,
			params
		);
	},

	addRideTypeToCountry: async (
		countryId: string,
		data: CountryRideTypeRequest
	): Promise<CountryRideTypeWithDetails> => {
		return api.post<CountryRideTypeWithDetails>(
			adminClient,
			`${BASE}/countries/${countryId}/ride-types`,
			data
		);
	},

	updateCountryRideType: async (
		countryId: string,
		rideTypeId: string,
		data: UpdateCountryRideTypeRequest
	): Promise<CountryRideTypeWithDetails> => {
		return api.put<CountryRideTypeWithDetails>(
			adminClient,
			`${BASE}/countries/${countryId}/ride-types/${rideTypeId}`,
			data
		);
	},

	removeRideTypeFromCountry: async (
		countryId: string,
		rideTypeId: string
	): Promise<void> => {
		return api.delete<void>(
			adminClient,
			`${BASE}/countries/${countryId}/ride-types/${rideTypeId}`
		);
	},

	// ==================== City Ride Types ====================

	getCityRideTypes: async (
		cityId: string,
		params?: { include_inactive?: boolean }
	): Promise<CityRideTypeWithDetails[]> => {
		return api.get<CityRideTypeWithDetails[]>(
			adminClient,
			`${BASE}/cities/${cityId}/ride-types`,
			params
		);
	},

	addRideTypeToCity: async (
		cityId: string,
		data: CityRideTypeRequest
	): Promise<CityRideTypeWithDetails> => {
		return api.post<CityRideTypeWithDetails>(
			adminClient,
			`${BASE}/cities/${cityId}/ride-types`,
			data
		);
	},

	updateCityRideType: async (
		cityId: string,
		rideTypeId: string,
		data: UpdateCityRideTypeRequest
	): Promise<CityRideTypeWithDetails> => {
		return api.put<CityRideTypeWithDetails>(
			adminClient,
			`${BASE}/cities/${cityId}/ride-types/${rideTypeId}`,
			data
		);
	},

	removeRideTypeFromCity: async (
		cityId: string,
		rideTypeId: string
	): Promise<void> => {
		return api.delete<void>(
			adminClient,
			`${BASE}/cities/${cityId}/ride-types/${rideTypeId}`
		);
	},
};
