export type BackgroundCheckStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'expired';
export type BackgroundCheckProvider = 'mock' | 'checkr' | 'sterling' | 'first_advantage';

export interface BackgroundCheck {
  id: string;
  driver_id: string;
  status: BackgroundCheckStatus;
  provider: BackgroundCheckProvider;
  notes?: string;
  initiated_by?: string;
  reviewed_by?: string;
  initiated_at: string;
  completed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InitiateBackgroundCheckRequest {
  driver_id: string;
  provider?: BackgroundCheckProvider;
}

export interface ReviewBackgroundCheckRequest {
  status: 'passed' | 'failed';
  notes?: string;
}

export interface DriverVerificationStatus {
  driver_id: string;
  background_check?: BackgroundCheck;
  overall_status: 'not_started' | 'in_progress' | 'passed' | 'failed';
  can_drive: boolean;
}
