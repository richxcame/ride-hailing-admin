// RideType represents a global ride type product (Economy, Premium, XL, etc.)
export interface RideType {
	id: string;
	name: string;
	description?: string;
	icon?: string;
	capacity: number;
	sort_order: number;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

// CountryRideType maps a ride type to a country (country-level availability)
export interface CountryRideType {
	country_id: string;
	ride_type_id: string;
	is_active: boolean;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

// CountryRideTypeWithDetails includes the ride type details
export interface CountryRideTypeWithDetails extends CountryRideType {
	ride_type_name: string;
	ride_type_description?: string;
	ride_type_icon?: string;
	ride_type_capacity: number;
}

// CityRideType maps a ride type to a city (overrides country-level)
export interface CityRideType {
	city_id: string;
	ride_type_id: string;
	is_active: boolean;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

// CityRideTypeWithDetails includes the ride type details
export interface CityRideTypeWithDetails extends CityRideType {
	ride_type_name: string;
	ride_type_description?: string;
	ride_type_icon?: string;
	ride_type_capacity: number;
}

// Request types
export interface CreateRideTypeRequest {
	name: string;
	description?: string;
	icon?: string;
	capacity: number;
	sort_order?: number;
	is_active: boolean;
}

export interface UpdateRideTypeRequest {
	name?: string;
	description?: string;
	icon?: string;
	capacity?: number;
	sort_order?: number;
	is_active?: boolean;
}

export interface CountryRideTypeRequest {
	ride_type_id: string;
	is_active: boolean;
	sort_order?: number;
}

export interface UpdateCountryRideTypeRequest {
	is_active?: boolean;
	sort_order?: number;
}

export interface CityRideTypeRequest {
	ride_type_id: string;
	is_active: boolean;
	sort_order?: number;
}

export interface UpdateCityRideTypeRequest {
	is_active?: boolean;
	sort_order?: number;
}
