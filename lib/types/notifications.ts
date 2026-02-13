// Notification channel types
export type NotificationChannel = 'push' | 'sms' | 'email';

// Notification campaign statuses
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';

// Audience segment types
export type AudienceSegment = 'all_riders' | 'all_drivers' | 'active_riders' | 'active_drivers' | 'inactive_users' | 'custom';

// Notification template
export interface NotificationTemplate {
	id: string;
	name: string;
	title: string;
	message: string;
	channel: NotificationChannel;
	variables?: string[];
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

// Notification campaign
export interface NotificationCampaign {
	id: string;
	name: string;
	title: string;
	message: string;
	channel: NotificationChannel;
	audience: AudienceSegment;
	audience_count?: number;
	status: CampaignStatus;
	scheduled_at?: string;
	sent_at?: string;
	total_sent: number;
	total_delivered: number;
	total_failed: number;
	total_opened: number;
	created_by?: string;
	created_at: string;
	updated_at: string;
}

// Notification log entry (individual delivery)
export interface NotificationLog {
	id: string;
	user_id: string;
	campaign_id?: string;
	title: string;
	message: string;
	channel: NotificationChannel;
	status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';
	failure_reason?: string;
	sent_at?: string;
	delivered_at?: string;
	opened_at?: string;
	created_at: string;
	user_name?: string;
}

// Request types
export interface CreateCampaignRequest {
	name: string;
	title: string;
	message: string;
	channel: NotificationChannel;
	audience: AudienceSegment;
	user_ids?: string[];
	scheduled_at?: string;
}

export interface UpdateCampaignRequest {
	name?: string;
	title?: string;
	message?: string;
	channel?: NotificationChannel;
	audience?: AudienceSegment;
	scheduled_at?: string;
}

export interface SendNotificationRequest {
	user_id: string;
	title: string;
	message: string;
	channel: NotificationChannel;
	data?: Record<string, unknown>;
}
