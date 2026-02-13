// Support ticket priorities
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

// Support ticket statuses
export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';

// Support ticket categories
export type TicketCategory =
	| 'ride_issue'
	| 'payment_issue'
	| 'driver_complaint'
	| 'rider_complaint'
	| 'account_issue'
	| 'app_bug'
	| 'feature_request'
	| 'other';

// Dispute statuses
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'rejected' | 'escalated';

// Dispute resolution types
export type DisputeResolutionType = 'full_refund' | 'partial_refund' | 'credit' | 'no_action' | 'driver_penalty';

// Cancellation fee waiver statuses
export type WaiverStatus = 'pending' | 'approved' | 'denied';

// Support ticket
export interface SupportTicket {
	id: string;
	user_id: string;
	assigned_to?: string;
	ride_id?: string;
	category: TicketCategory;
	priority: TicketPriority;
	status: TicketStatus;
	subject: string;
	description: string;
	internal_notes?: string;
	resolution?: string;
	resolved_at?: string;
	created_at: string;
	updated_at: string;
	// Joined
	user_name?: string;
	user_email?: string;
	assigned_to_name?: string;
}

// Support ticket message (thread)
export interface TicketMessage {
	id: string;
	ticket_id: string;
	sender_id: string;
	sender_type: 'user' | 'admin';
	message: string;
	is_internal: boolean;
	created_at: string;
	sender_name?: string;
}

// Dispute
export interface Dispute {
	id: string;
	ride_id: string;
	rider_id: string;
	driver_id?: string;
	status: DisputeStatus;
	reason: string;
	description: string;
	resolution_type?: DisputeResolutionType;
	resolution_notes?: string;
	refund_amount?: number;
	credit_amount?: number;
	resolved_by?: string;
	resolved_at?: string;
	created_at: string;
	updated_at: string;
	// Joined
	rider_name?: string;
	driver_name?: string;
	ride_fare?: number;
}

// Cancellation record
export interface CancellationRecord {
	id: string;
	ride_id: string;
	cancelled_by: 'rider' | 'driver' | 'system';
	user_id: string;
	reason?: string;
	cancellation_fee: number;
	fee_waived: boolean;
	waiver_reason?: string;
	waiver_status?: WaiverStatus;
	waiver_approved_by?: string;
	created_at: string;
	// Joined
	user_name?: string;
	ride_pickup?: string;
	ride_dropoff?: string;
}

// Cancellation statistics
export interface CancellationStats {
	total_cancellations: number;
	rider_cancellations: number;
	driver_cancellations: number;
	system_cancellations: number;
	total_fees_collected: number;
	total_fees_waived: number;
	cancellation_rate: number;
	avg_fee_amount: number;
	top_reasons: Array<{ reason: string; count: number }>;
}

// Request types
export interface CreateTicketRequest {
	user_id: string;
	ride_id?: string;
	category: TicketCategory;
	priority: TicketPriority;
	subject: string;
	description: string;
}

export interface UpdateTicketRequest {
	assigned_to?: string;
	priority?: TicketPriority;
	status?: TicketStatus;
	internal_notes?: string;
	resolution?: string;
}

export interface ReplyTicketRequest {
	message: string;
	is_internal?: boolean;
}

export interface ResolveDisputeRequest {
	resolution_type: DisputeResolutionType;
	resolution_notes: string;
	refund_amount?: number;
	credit_amount?: number;
}

export interface WaiveCancellationFeeRequest {
	waiver_reason: string;
}
