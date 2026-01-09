// API response wrapper matching backend format
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination parameters
export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Date range filter
export interface DateRangeFilter {
  start_date?: string;
  end_date?: string;
}

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Auth request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: 'rider' | 'driver' | 'admin';
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'rider' | 'driver' | 'admin';
    phone_number: string;
    is_active: boolean;
    is_verified: boolean;
    profile_image?: string;
  };
}

// Ride request types
export interface CreateRideRequest {
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  dropoff_address: string;
  ride_type_id?: string;
  promo_code?: string;
  is_scheduled?: boolean;
  scheduled_at?: string;
}

export interface RateRideRequest {
  rating: number;
  feedback?: string;
}

export interface CancelRideRequest {
  cancellation_reason: string;
}

// Payment request types
export interface TopUpWalletRequest {
  amount: number;
  payment_method_id: string; // Stripe payment method ID
}

export interface RefundRequest {
  reason: string;
}

// Admin request types
export interface SuspendUserRequest {
  reason: string;
  duration_days?: number;
}

export interface ApproveDriverRequest {
  notes?: string;
}

export interface RejectDriverRequest {
  reason: string;
}

// Promo request types
export interface CreatePromoRequest {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number;
  expiry_date: string;
  description?: string;
}

export interface ValidatePromoRequest {
  code: string;
  ride_type_id?: string;
}

// Notification request types
export interface SendNotificationRequest {
  user_id: string;
  title: string;
  message: string;
  type: 'push' | 'sms' | 'email';
  data?: Record<string, unknown>;
}

export interface ScheduleNotificationRequest extends SendNotificationRequest {
  scheduled_at: string;
}

export interface BulkNotificationRequest {
  user_ids: string[];
  title: string;
  message: string;
  type: 'push' | 'sms' | 'email';
  data?: Record<string, unknown>;
}

// Fraud request types
export interface CreateFraudAlertRequest {
  user_id: string;
  alert_type: 'duplicate_account' | 'payment_fraud' | 'ride_fraud' | 'suspicious_activity';
  alert_level: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface InvestigateFraudAlertRequest {
  notes?: string;
}

export interface ResolveFraudAlertRequest {
  resolution: string;
  action_taken?: string;
}

// Analytics query types
export interface RevenueQuery extends DateRangeFilter {
  group_by?: 'day' | 'week' | 'month';
}

export interface DriverPerformanceQuery extends DateRangeFilter {
  driver_id?: string;
  limit?: number;
  offset?: number;
}
