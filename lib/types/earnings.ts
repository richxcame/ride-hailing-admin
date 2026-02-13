// Payout statuses
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'on_hold';

// Payout methods
export type PayoutMethod = 'bank_transfer' | 'mobile_money' | 'wallet';

// Driver earnings summary
export interface DriverEarningsSummary {
	driver_id: string;
	driver_name: string;
	total_earnings: number;
	total_rides: number;
	pending_payout: number;
	last_payout_at?: string;
	avg_earnings_per_ride: number;
	commission_paid: number;
	tips_received: number;
	bonuses_earned: number;
	current_balance: number;
}

// Payout record
export interface Payout {
	id: string;
	driver_id: string;
	amount: number;
	method: PayoutMethod;
	status: PayoutStatus;
	reference?: string;
	failure_reason?: string;
	notes?: string;
	requested_at: string;
	processed_at?: string;
	completed_at?: string;
	processed_by?: string;
	created_at: string;
	updated_at: string;
	// Joined
	driver_name?: string;
}

// Earnings breakdown per ride
export interface RideEarning {
	ride_id: string;
	driver_id: string;
	fare_amount: number;
	commission_amount: number;
	driver_earning: number;
	tip_amount: number;
	bonus_amount: number;
	net_earning: number;
	created_at: string;
}

// Earnings statistics
export interface EarningsStats {
	total_payouts: number;
	total_amount_paid: number;
	pending_payouts: number;
	pending_amount: number;
	failed_payouts: number;
	avg_payout_amount: number;
	total_commission_collected: number;
	total_driver_earnings: number;
}

// Request types
export interface CreatePayoutRequest {
	driver_id: string;
	amount: number;
	method: PayoutMethod;
	notes?: string;
}

export interface ProcessPayoutRequest {
	reference?: string;
	notes?: string;
}

export interface BulkPayoutRequest {
	driver_ids: string[];
	method: PayoutMethod;
	notes?: string;
}
