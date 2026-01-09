// User roles matching backend
export type UserRole = 'rider' | 'driver' | 'admin';

// Ride statuses matching backend
export type RideStatus =
  | 'requested'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// Payment statuses
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Payment methods
export type PaymentMethod = 'card' | 'wallet' | 'cash';

// Fraud alert types
export type FraudAlertType =
  | 'duplicate_account'
  | 'payment_fraud'
  | 'ride_fraud'
  | 'suspicious_activity';

// Fraud alert levels
export type FraudAlertLevel = 'low' | 'medium' | 'high' | 'critical';

// Fraud alert statuses
export type FraudAlertStatus = 'pending' | 'investigating' | 'resolved';

// Notification types
export type NotificationType = 'push' | 'sms' | 'email';

// Notification statuses
export type NotificationStatus = 'sent' | 'failed' | 'pending';

// Discount types
export type DiscountType = 'percentage' | 'fixed';

// User model
export interface User {
  id: string;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  profile_image?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// Driver model
export interface Driver {
  id: string;
  user_id: string;
  license_number: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  vehicle_year: number;
  is_available: boolean;
  is_online: boolean;
  rating: number;
  total_rides: number;
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: User;
}

// Ride model
export interface Ride {
  id: string;
  rider_id: string;
  driver_id?: string;
  status: RideStatus;
  pickup_latitude: number;
  pickup_longitude: number;
  pickup_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  dropoff_address: string;
  estimated_distance?: number;
  estimated_duration?: number;
  estimated_fare?: number;
  actual_distance?: number;
  actual_duration?: number;
  final_fare?: number;
  surge_multiplier?: number;
  requested_at: string;
  accepted_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  rating?: number;
  feedback?: string;
  cancellation_reason?: string;
  ride_type_id?: string;
  promo_code_id?: string;
  discount_amount?: number;
  is_scheduled: boolean;
  scheduled_at?: string;
  scheduled_notification_sent?: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  rider?: User;
  driver?: User;
  ride_type?: RideType;
}

// Wallet model
export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// Payment model
export interface Payment {
  id: string;
  ride_id: string;
  rider_id: string;
  driver_id: string;
  amount: number;
  commission: number;
  driver_earnings: number;
  method: PaymentMethod;
  status: PaymentStatus;
  stripe_payment_id?: string;
  stripe_charge_id?: string;
  transaction_id?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

// Promo code model
export interface PromoCode {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  max_uses: number;
  used_count: number;
  expiry_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Ride type model
export interface RideType {
  id: string;
  name: string;
  description: string;
  base_fare: number;
  per_km_rate: number;
  per_minute_rate: number;
  minimum_fare: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Referral code model
export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  uses_count: number;
  max_uses: number;
  created_at: string;
  updated_at: string;
}

// Notification model
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  type: NotificationType;
  status: NotificationStatus;
  is_read: boolean;
  created_at: string;
}

// Fraud alert model
export interface FraudAlert {
  id: string;
  user_id: string;
  alert_type: FraudAlertType;
  alert_level: FraudAlertLevel;
  risk_score: number;
  status: FraudAlertStatus;
  description?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
  // Joined data
  user?: User;
}

// Dashboard statistics
export interface DashboardStats {
  total_rides: number;
  total_users: number;
  total_revenue: number;
  active_drivers: number;
  pending_driver_approvals: number;
  fraud_alerts_count: number;
  rides_last_24h: number;
  revenue_last_30_days: number;
}

// Revenue metrics
export interface RevenueMetrics {
  total_revenue: number;
  total_commission: number;
  total_driver_earnings: number;
  average_fare: number;
  revenue_by_date: Array<{
    date: string;
    revenue: number;
    rides: number;
  }>;
  revenue_by_payment_method: Array<{
    method: PaymentMethod;
    revenue: number;
    count: number;
  }>;
}

// Driver performance metrics
export interface DriverPerformance {
  driver_id: string;
  driver_name: string;
  total_rides: number;
  average_rating: number;
  total_earnings: number;
  acceptance_rate: number;
  cancellation_rate: number;
  completion_rate: number;
}

// Promo performance metrics
export interface PromoPerformance {
  promo_code: string;
  total_uses: number;
  total_discount_given: number;
  total_revenue_generated: number;
  unique_users: number;
  conversion_rate: number;
}
