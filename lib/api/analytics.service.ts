import { api, analyticsClient } from './client';
import {
  RevenueQuery,
  DriverPerformanceQuery,
  DateRangeFilter,
  PaginationParams,
} from '@/lib/types/api';
import {
  RevenueMetrics,
  DriverPerformance,
  PromoPerformance,
} from '@/lib/types/models';

/**
 * Analytics Service API Client
 * Connects to Analytics Service (:8091)
 * Admin-only endpoints
 */
export const analyticsService = {
  /**
   * Get revenue metrics with date range and grouping
   * GET /api/v1/analytics/revenue
   */
  getRevenue: async (params?: RevenueQuery): Promise<RevenueMetrics> => {
    return api.get<RevenueMetrics>(analyticsClient, '/api/v1/analytics/revenue', params);
  },

  /**
   * Get promo code performance metrics
   * GET /api/v1/analytics/promos/performance
   */
  getPromoPerformance: async (
    params?: DateRangeFilter & PaginationParams
  ): Promise<{
    data: PromoPerformance[];
    total: number;
  }> => {
    return api.get(analyticsClient, '/api/v1/analytics/promos/performance', params);
  },

  /**
   * Get ride type statistics
   * GET /api/v1/analytics/ride-types/stats
   */
  getRideTypeStats: async (
    params?: DateRangeFilter
  ): Promise<
    Array<{
      ride_type_id: string;
      ride_type_name: string;
      total_rides: number;
      total_revenue: number;
      average_fare: number;
      average_distance: number;
    }>
  > => {
    return api.get(analyticsClient, '/api/v1/analytics/ride-types/stats', params);
  },

  /**
   * Get referral program metrics
   * GET /api/v1/analytics/referrals/metrics
   */
  getReferralMetrics: async (
    params?: DateRangeFilter
  ): Promise<{
    total_referrals: number;
    total_referral_revenue: number;
    top_referrers: Array<{
      user_id: string;
      user_name: string;
      referral_count: number;
      referral_revenue: number;
    }>;
  }> => {
    return api.get(analyticsClient, '/api/v1/analytics/referrals/metrics', params);
  },

  /**
   * Get driver performance metrics
   * GET /api/v1/analytics/drivers/performance
   */
  getDriverPerformance: async (
    params?: DriverPerformanceQuery
  ): Promise<{
    data: DriverPerformance[];
    total: number;
  }> => {
    return api.get(analyticsClient, '/api/v1/analytics/drivers/performance', params);
  },

  /**
   * Get demand patterns by location and time
   * GET /api/v1/analytics/demand/patterns
   */
  getDemandPatterns: async (
    params?: DateRangeFilter & {
      location?: string;
      group_by?: 'hour' | 'day' | 'week';
    }
  ): Promise<
    Array<{
      time_period: string;
      location?: string;
      ride_count: number;
      average_surge: number;
    }>
  > => {
    return api.get(analyticsClient, '/api/v1/analytics/demand/patterns', params);
  },

  /**
   * Get user retention metrics
   * GET /api/v1/analytics/retention
   */
  getRetentionMetrics: async (
    params?: DateRangeFilter
  ): Promise<{
    daily_active_users: number;
    weekly_active_users: number;
    monthly_active_users: number;
    retention_rate: number;
    churn_rate: number;
  }> => {
    return api.get(analyticsClient, '/api/v1/analytics/retention', params);
  },

  /**
   * Export analytics data as CSV
   * GET /api/v1/analytics/export
   */
  exportData: async (
    params: DateRangeFilter & {
      report_type: 'revenue' | 'rides' | 'drivers' | 'promos';
    }
  ): Promise<Blob> => {
    const response = await analyticsClient.get('/api/v1/analytics/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
