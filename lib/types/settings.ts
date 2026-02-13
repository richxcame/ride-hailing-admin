// App setting value types
export type SettingType = 'string' | 'number' | 'boolean' | 'json';

// Setting categories
export type SettingCategory =
	| 'general'
	| 'commission'
	| 'rides'
	| 'payments'
	| 'notifications'
	| 'referrals'
	| 'safety'
	| 'feature_flags';

// App setting
export interface AppSetting {
	id: string;
	key: string;
	value: string;
	type: SettingType;
	category: SettingCategory;
	label: string;
	description?: string;
	is_editable: boolean;
	updated_by?: string;
	created_at: string;
	updated_at: string;
}

// Request types
export interface UpdateSettingRequest {
	value: string;
}

export interface BulkUpdateSettingsRequest {
	settings: Array<{
		key: string;
		value: string;
	}>;
}
