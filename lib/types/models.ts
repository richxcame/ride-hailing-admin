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
  | 'payment_fraud'
  | 'account_fraud'
  | 'location_fraud'
  | 'ride_fraud'
  | 'rating_manipulation'
  | 'promo_abuse';

// Fraud alert levels
export type FraudAlertLevel = 'low' | 'medium' | 'high' | 'critical';

// Fraud alert statuses
export type FraudAlertStatus = 'pending' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved';

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

// Rider info returned with rides
export interface RideRider {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_image?: string;
}

// Driver info returned with rides (includes driver-specific fields)
export interface RideDriver {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_image?: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  rating: number;
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
  rider?: RideRider;
  driver?: RideDriver;
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
  description: string;
  details?: Record<string, unknown>;
  detected_at: string;
  investigated_at?: string;
  investigated_by?: string;
  resolved_at?: string;
  notes?: string;
  action_taken?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: User;
}

// User risk profile
export interface UserRiskProfile {
  user_id: string;
  risk_score: number;
  total_alerts: number;
  critical_alerts: number;
  confirmed_fraud_cases: number;
  last_alert_at?: string;
  account_suspended: boolean;
  last_updated: string;
}

// Fraud statistics
export interface FraudStatistics {
  period: string;
  total_alerts: number;
  critical_alerts: number;
  high_alerts: number;
  medium_alerts: number;
  low_alerts: number;
  confirmed_fraud_cases: number;
  false_positives: number;
  pending_investigation: number;
  estimated_loss_prevented: number;
  average_response_time: number;
}

// Fraud pattern
export interface FraudPattern {
  id: string;
  pattern_type: string;
  description: string;
  occurrences: number;
  affected_users: string[];
  first_detected: string;
  last_detected: string;
  details?: Record<string, unknown>;
  severity: FraudAlertLevel;
  is_active: boolean;
}

// Payment fraud indicators
export interface PaymentFraudIndicators {
  user_id: string;
  failed_payment_attempts: number;
  chargeback_count: number;
  multiple_payment_methods: number;
  suspicious_transactions: number;
  rapid_payment_changes: boolean;
  risk_score: number;
}

// Ride fraud indicators
export interface RideFraudIndicators {
  user_id: string;
  excessive_cancellations: number;
  unusual_ride_patterns: boolean;
  fake_gps_detected: boolean;
  collision_with_driver: boolean;
  promo_abuse: boolean;
  risk_score: number;
}

// Account fraud indicators
export interface AccountFraudIndicators {
  user_id: string;
  multiple_accounts_same_device: boolean;
  rapid_account_creation: boolean;
  suspicious_email_pattern: boolean;
  fake_phone_number: boolean;
  vpn_usage: boolean;
  risk_score: number;
}

// Dashboard statistics (base /api/v1/admin/dashboard endpoint)
export interface DashboardStats {
  users: {
    total_users: number;
    total_riders: number;
    total_drivers: number;
    active_users: number;
  };
  rides: {
    total_rides: number;
    completed_rides: number;
    cancelled_rides: number;
    active_rides: number;
    total_revenue: number;
    avg_fare: number;
  };
  today_rides: {
    total_rides: number;
    completed_rides: number;
    cancelled_rides: number;
    active_rides: number;
    total_revenue: number;
    avg_fare: number;
  };
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

// Real-time dashboard metrics
export interface RealtimeMetrics {
  active_rides: number;
  available_drivers: number;
  pending_requests: number;
  today_revenue: number;
  today_revenue_change: number;
  online_drivers: number;
  total_riders_active: number;
  avg_wait_time: number;
  avg_eta: number;
}

// Dashboard summary (enhanced)
export interface DashboardSummary {
  rides: {
    total: number;
    completed: number;
    cancelled: number;
    in_progress: number;
    pending: number;
    completion_rate: number;
    cancellation_rate: number;
    cancelled_by_rider: number;
    cancelled_by_driver: number;
    avg_duration: number;
    avg_distance: number;
    change_vs_previous: number;
  };
  drivers: {
    total_active: number;
    online_now: number;
    available_now: number;
    busy_now: number;
    pending_approvals: number;
    avg_rating: number;
    utilization_rate: number;
    new_signups: number;
  };
  riders: {
    total_active: number;
    new_signups: number;
    active_today: number;
    retention_rate: number;
  };
  revenue: {
    total: number;
    commission: number;
    driver_earnings: number;
    avg_fare: number;
    change_vs_previous: number;
    by_payment_method: Array<{
      method: PaymentMethod;
      amount: number;
      percentage: number;
    }>;
  };
  alerts: {
    fraud_alerts: number;
    critical_alerts: number;
    pending_investigations: number;
  };
}

// Revenue trend data point
export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  rides: number;
  avg_fare: number;
  commission: number;
}

// Revenue trend response
export interface RevenueTrend {
  period: string;
  total_revenue: number;
  avg_daily_revenue: number;
  trend: RevenueTrendPoint[];
}

// Activity feed item
export interface ActivityFeedItem {
  id: string;
  type: 'ride_completed' | 'ride_cancelled' | 'driver_approved' | 'driver_rejected' | 'fraud_alert' | 'user_suspended' | 'user_activated' | 'promo_redeemed' | 'payment_failed' | 'high_value_ride';
  title: string;
  description: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

// Analytics types
export interface AnalyticsDashboard {
  total_rides: number;
  active_rides: number;
  completed_today: number;
  revenue_today: number;
  active_drivers: number;
  active_riders: number;
  avg_rating: number;
  top_ride_type: {
    ride_type_id: string;
    name: string;
    total_rides: number;
    total_revenue: number;
    avg_fare: number;
    percentage: number;
  };
}

export interface RevenueAnalytics {
  period: string;
  total_revenue: number;
  total_rides: number;
  avg_fare_per_ride: number;
  total_discounts: number;
  platform_earnings: number;
  driver_earnings: number;
}

export interface RevenueTimeseriesData {
  date: string;
  revenue: number;
  rides: number;
  avg_fare: number;
}

export interface RideTypeAnalytics {
  ride_type_id: string;
  name: string;
  total_rides: number;
  total_revenue: number;
  avg_fare: number;
  percentage: number;
}

export interface HourlyRideData {
  hour: number;
  rides: number;
  avg_fare: number;
  avg_wait_time: number;
}

export interface RidesMetrics {
  avg_wait_time_minutes: number;
  avg_ride_duration_minutes: number;
  avg_distance_km: number;
  cancellation_rate: number;
  rider_cancellation_rate: number;
  driver_cancellation_rate: number;
  surge_rides_percentage: number;
  avg_surge_multiplier: number;
}

export interface DriversPerformance {
  total_active_drivers: number;
  avg_rides_per_driver: number;
  avg_online_hours: number;
  avg_acceptance_rate: number;
  avg_cancellation_rate: number;
  avg_rating: number;
  new_drivers: number;
  churned_drivers: number;
}

export interface RidersGrowth {
  new_riders: number;
  returning_riders: number;
  churned_riders: number;
  retention_rate: number;
  avg_rides_per_rider: number;
  first_time_riders_today: number;
  lifetime_value_avg: number;
}

export interface TopDriver {
  driver_id: string;
  driver_name: string;
  total_rides: number;
  total_earnings: number;
  avg_rating: number;
  completion_rate: number;
  cancellation_rate: number;
}

export interface ReferralsAnalytics {
  total_referrals: number;
  completed_referrals: number;
  total_bonuses_paid: number;
  avg_bonus_per_referral: number;
  conversion_rate: number;
}

export interface FinancialReport {
  period: string;
  gross_revenue: number;
  net_revenue: number;
  platform_commission: number;
  driver_payouts: number;
  promo_discounts: number;
  referral_bonuses: number;
  refunds: number;
  total_expenses: number;
  profit: number;
  profit_margin_percent: number;
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  avg_revenue_per_ride: number;
  top_revenue_day_amount: number;
}

export interface ComparisonMetric {
  current: number;
  previous: number;
  change_percent: number;
}

export interface AnalyticsComparison {
  revenue: ComparisonMetric;
  rides: ComparisonMetric;
  new_riders: ComparisonMetric;
  avg_rating: ComparisonMetric;
}
