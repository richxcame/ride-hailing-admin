// Payment transaction statuses
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';

// Payment methods
export type TransactionMethod = 'card' | 'wallet' | 'cash';

// Payment transaction
export interface Transaction {
	id: string;
	ride_id: string;
	rider_id: string;
	driver_id: string;
	amount: number;
	commission: number;
	driver_earnings: number;
	method: TransactionMethod;
	status: TransactionStatus;
	stripe_payment_id?: string;
	stripe_charge_id?: string;
	transaction_ref?: string;
	failure_reason?: string;
	refund_amount?: number;
	refunded_at?: string;
	created_at: string;
	updated_at: string;
	// Joined
	rider_name?: string;
	driver_name?: string;
}

// Payment statistics
export interface PaymentStats {
	total_transactions: number;
	total_amount: number;
	total_commission: number;
	total_driver_earnings: number;
	completed_transactions: number;
	failed_transactions: number;
	refunded_transactions: number;
	avg_transaction_amount: number;
	by_method: Array<{
		method: TransactionMethod;
		count: number;
		amount: number;
	}>;
}

// Refund request
export interface RefundRequest {
	amount?: number;
	reason: string;
}
