// Zone types matching backend
export type ZoneType =
	| 'airport'
	| 'downtown'
	| 'transit_hub'
	| 'event_venue'
	| 'border_crossing'
	| 'toll_zone';

// Country model
export interface Country {
	id: string;
	code: string;
	code3: string;
	name: string;
	native_name?: string;
	currency_code: string;
	default_language: string;
	phone_prefix: string;
	timezone: string;
	is_active: boolean;
	launched_at?: string;
	regulations: Record<string, unknown>;
	// Backend stores + returns these as flat string arrays; same shape on PUT.
	payment_methods: string[];
	required_driver_documents: string[];
	created_at: string;
	updated_at: string;
}

// Region model
export interface Region {
	id: string;
	country_id: string;
	code: string;
	name: string;
	native_name?: string;
	timezone?: string;
	is_active: boolean;
	launched_at?: string;
	created_at: string;
	updated_at: string;
	country?: Country;
}

// City model
export interface City {
	id: string;
	region_id: string;
	name: string;
	native_name?: string;
	timezone?: string;
	center_latitude: number;
	center_longitude: number;
	boundary?: string;
	population?: number;
	is_active: boolean;
	launched_at?: string;
	created_at: string;
	updated_at: string;
	region?: Region;
}

// Pricing zone model
export interface PricingZone {
	id: string;
	city_id: string;
	name: string;
	zone_type: ZoneType;
	boundary: string;
	center_latitude: number;
	center_longitude: number;
	priority: number;
	is_active: boolean;
	metadata: Record<string, unknown>;
	created_at: string;
	updated_at: string;
	city?: City;
}

// Stats
export interface GeoLevelStats {
	total: number;
	active: number;
}

export interface GeoStats {
	countries: GeoLevelStats;
	regions: GeoLevelStats;
	cities: GeoLevelStats;
	pricing_zones: GeoLevelStats;
}

// Request types
export interface CreateCountryRequest {
	code: string;
	code3: string;
	name: string;
	native_name?: string;
	currency_code: string;
	default_language: string;
	phone_prefix: string;
	timezone: string;
	is_active: boolean;
	regulations?: Record<string, unknown>;
	payment_methods?: string[];
	required_driver_documents?: string[];
}

export interface UpdateCountryRequest {
	code?: string;
	code3?: string;
	name?: string;
	native_name?: string;
	currency_code?: string;
	default_language?: string;
	phone_prefix?: string;
	timezone?: string;
	is_active?: boolean;
	regulations?: Record<string, unknown>;
	payment_methods?: string[];
	required_driver_documents?: string[];
}

export interface CreateRegionRequest {
	code: string;
	name: string;
	native_name?: string;
	timezone?: string;
	is_active: boolean;
}

export interface UpdateRegionRequest {
	code?: string;
	name?: string;
	native_name?: string;
	timezone?: string;
	is_active?: boolean;
}

export interface CreateCityRequest {
	name: string;
	native_name?: string;
	timezone?: string;
	center_latitude: number;
	center_longitude: number;
	boundary?: string;
	population?: number;
	is_active: boolean;
}

export interface UpdateCityRequest {
	name?: string;
	native_name?: string;
	timezone?: string;
	center_latitude?: number;
	center_longitude?: number;
	boundary?: string;
	population?: number;
	is_active?: boolean;
}

export interface CreatePricingZoneRequest {
	name: string;
	zone_type: ZoneType;
	boundary: string;
	center_latitude: number;
	center_longitude: number;
	priority?: number;
	is_active: boolean;
	metadata?: Record<string, unknown>;
}

export interface UpdatePricingZoneRequest {
	name?: string;
	zone_type?: ZoneType;
	boundary?: string;
	center_latitude?: number;
	center_longitude?: number;
	priority?: number;
	is_active?: boolean;
	metadata?: Record<string, unknown>;
}
