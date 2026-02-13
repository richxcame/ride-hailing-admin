// Document types
export type DocumentType = 'drivers_license' | 'vehicle_registration' | 'insurance' | 'background_check' | 'profile_photo' | 'vehicle_photo';

// Document review statuses
export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

// Driver document
export interface DriverDocument {
	id: string;
	driver_id: string;
	type: DocumentType;
	file_url: string;
	status: DocumentStatus;
	expiry_date?: string;
	rejection_reason?: string;
	reviewed_by?: string;
	reviewed_at?: string;
	submitted_at: string;
	created_at: string;
	updated_at: string;
	// Joined
	driver_name?: string;
}

// Document review request
export interface ReviewDocumentRequest {
	status: 'approved' | 'rejected';
	rejection_reason?: string;
}
