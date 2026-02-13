// Pricing config levels (derived from location IDs, not stored)
export type PricingConfigLevel = 'global' | 'country' | 'region' | 'city' | 'zone';

// Pricing version statuses
export type PricingVersionStatus = 'draft' | 'active' | 'archived' | 'ab_test';

// Weather condition types (matching backend constants)
export type WeatherCondition =
	| 'clear'
	| 'cloudy'
	| 'rain'
	| 'heavy_rain'
	| 'snow'
	| 'storm'
	| 'extreme_heat'
	| 'fog';

// Event types (matching backend constants)
export type EventType = 'sports' | 'concert' | 'conference' | 'holiday' | 'festival' | 'other';

// Cancellation fee types
export type CancellationFeeType = 'fixed' | 'percentage';

// Pricing config version
export interface PricingConfigVersion {
	id: string;
	version_number: number;
	name: string;
	description?: string;
	status: PricingVersionStatus;
	ab_test_percentage?: number;
	effective_from?: string;
	effective_until?: string;
	created_by?: string;
	approved_by?: string;
	approved_at?: string;
	created_at: string;
	updated_at: string;
}

// Cancellation fee tier (embedded in PricingConfig as JSON array)
export interface CancellationFee {
	after_minutes: number;
	fee: number;
	fee_type: CancellationFeeType; // "fixed" or "percentage"
}

// Pricing config — all pricing fields nullable (null = inherit from parent)
export interface PricingConfig {
	id: string;
	version_id: string;
	country_id?: string;
	region_id?: string;
	city_id?: string;
	zone_id?: string;
	ride_type_id?: string;
	// Core pricing
	base_fare?: number | null;
	per_km_rate?: number | null;
	per_minute_rate?: number | null;
	minimum_fare?: number | null;
	booking_fee?: number | null;
	// Commission
	platform_commission_pct?: number | null;
	driver_incentive_pct?: number | null;
	// Surge limits
	surge_min_multiplier?: number | null;
	surge_max_multiplier?: number | null;
	// Tax
	tax_rate_pct?: number | null;
	tax_inclusive?: boolean | null;
	// Cancellation fees (JSON array)
	cancellation_fees?: CancellationFee[];
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

// Surge threshold
export interface SurgeThreshold {
	id: string;
	version_id: string;
	country_id?: string;
	region_id?: string;
	city_id?: string;
	demand_supply_ratio_min: number;
	demand_supply_ratio_max?: number;
	multiplier: number;
	is_active: boolean;
	created_at?: string;
}

// Fee schedule for zone fees
export interface FeeSchedule {
	days: number[]; // 0=Sunday, 6=Saturday
	start_time: string; // HH:MM
	end_time: string; // HH:MM
}

// Time-based multiplier
export interface TimeMultiplier {
	id: string;
	version_id: string;
	country_id?: string;
	region_id?: string;
	city_id?: string;
	name: string;
	days_of_week: number[]; // 0=Sunday, 6=Saturday
	start_time: string; // HH:MM
	end_time: string; // HH:MM
	multiplier: number;
	priority: number;
	is_active: boolean;
	created_at?: string;
	updated_at?: string;
}

// Weather-based multiplier
export interface WeatherMultiplier {
	id: string;
	version_id: string;
	country_id?: string;
	region_id?: string;
	city_id?: string;
	weather_condition: WeatherCondition;
	multiplier: number;
	is_active: boolean;
	created_at?: string;
}

// Event-based multiplier
export interface EventMultiplier {
	id: string;
	version_id: string;
	zone_id?: string;
	city_id?: string;
	event_name: string;
	event_type: EventType;
	starts_at: string;
	ends_at: string;
	pre_event_minutes: number;
	post_event_minutes: number;
	multiplier: number;
	expected_demand_increase?: number;
	is_active: boolean;
	created_at?: string;
}

// Zone fee
export interface ZoneFee {
	id: string;
	zone_id: string;
	version_id: string;
	fee_type: string; // pickup_fee, dropoff_fee, toll, etc.
	ride_type_id?: string;
	amount: number;
	is_percentage: boolean;
	applies_pickup: boolean;
	applies_dropoff: boolean;
	schedule?: FeeSchedule;
	is_active: boolean;
	created_at?: string;
	updated_at?: string;
}

// Pricing preview / resolution
export interface PricingPreviewRequest {
	latitude: number;
	longitude: number;
	ride_type_id?: string;
}

export interface PricingPreviewResult {
	version_id: string;
	country_id?: string;
	region_id?: string;
	city_id?: string;
	zone_id?: string;
	ride_type_id?: string;
	base_fare: number;
	per_km_rate: number;
	per_minute_rate: number;
	minimum_fare: number;
	booking_fee: number;
	platform_commission_pct: number;
	driver_incentive_pct: number;
	surge_min_multiplier: number;
	surge_max_multiplier: number;
	tax_rate_pct: number;
	tax_inclusive: boolean;
	cancellation_fees: CancellationFee[];
	inheritance_chain?: string[];
}

// Request types
export interface CreatePricingVersionRequest {
	name: string;
	description?: string;
	effective_from?: string;
	effective_until?: string;
}

export interface UpdatePricingVersionRequest {
	name?: string;
	description?: string;
	effective_from?: string;
	effective_until?: string;
}

export interface CreatePricingConfigRequest {
	country_id?: string;
	region_id?: string;
	city_id?: string;
	zone_id?: string;
	ride_type_id?: string;
	base_fare?: number | null;
	per_km_rate?: number | null;
	per_minute_rate?: number | null;
	minimum_fare?: number | null;
	booking_fee?: number | null;
	platform_commission_pct?: number | null;
	driver_incentive_pct?: number | null;
	surge_min_multiplier?: number | null;
	surge_max_multiplier?: number | null;
	tax_rate_pct?: number | null;
	tax_inclusive?: boolean | null;
	cancellation_fees?: CancellationFee[];
	is_active: boolean;
}

export type UpdatePricingConfigRequest = CreatePricingConfigRequest;

// Audit log entry
export interface PricingAuditLog {
	id: string;
	entity_type: string;
	entity_id: string;
	action: string;
	old_value?: Record<string, unknown>;
	new_value?: Record<string, unknown>;
	changed_by?: string;
	created_at: string;
}
