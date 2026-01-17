import { api, adminClient } from './client';
import {
  PaginatedResponse,
  PaginationParams,
  SuspendUserRequest,
  ApproveDriverRequest,
  RejectDriverRequest,
  DateRangeFilter,
} from '@/lib/types/api';
import {
  User,
  Driver,
  Ride,
  DashboardStats,
  RealtimeMetrics,
  DashboardSummary,
  RevenueTrend,
  ActivityFeedItem,
} from '@/lib/types/models';

/**
 * Admin Service API Client
 * Connects to Admin Service (:8088)
 * All endpoints require admin role
 */
export const adminService = {
  /**
   * Get dashboard statistics
   * GET /api/v1/admin/dashboard
   */
  getDashboard: async (): Promise<DashboardStats> => {
    return api.get<DashboardStats>(adminClient, '/api/v1/admin/dashboard');
  },

  /**
   * List all users with pagination
   * GET /api/v1/admin/users
   */
  getUsers: async (
    params?: PaginationParams & {
      role?: string;
      is_active?: boolean;
      search?: string;
    }
  ): Promise<PaginatedResponse<User>> => {
    return api.get<PaginatedResponse<User>>(adminClient, '/api/v1/admin/users', params);
  },

  /**
   * Get user details by ID
   * GET /api/v1/admin/users/:id
   */
  getUser: async (userId: string): Promise<User> => {
    return api.get<User>(adminClient, `/api/v1/admin/users/${userId}`);
  },

  /**
   * Suspend a user account
   * POST /api/v1/admin/users/:id/suspend
   */
  suspendUser: async (userId: string, data: SuspendUserRequest): Promise<User> => {
    return api.post<User>(adminClient, `/api/v1/admin/users/${userId}/suspend`, data);
  },

  /**
   * Activate a suspended user account
   * POST /api/v1/admin/users/:id/activate
   */
  activateUser: async (userId: string): Promise<User> => {
    return api.post<User>(adminClient, `/api/v1/admin/users/${userId}/activate`);
  },

  /**
   * Get pending driver applications
   * GET /api/v1/admin/drivers/pending
   */
  getPendingDrivers: async (params?: PaginationParams): Promise<PaginatedResponse<Driver>> => {
    return api.get<PaginatedResponse<Driver>>(
      adminClient,
      '/api/v1/admin/drivers/pending',
      params
    );
  },

  /**
   * Get all drivers
   * GET /api/v1/admin/drivers
   */
  getDrivers: async (
    params?: PaginationParams & {
      is_online?: boolean;
      is_available?: boolean;
      search?: string;
    }
  ): Promise<PaginatedResponse<Driver>> => {
    return api.get<PaginatedResponse<Driver>>(adminClient, '/api/v1/admin/drivers', params);
  },

  /**
   * Get driver details by ID
   * GET /api/v1/admin/drivers/:id
   */
  getDriver: async (driverId: string): Promise<Driver> => {
    return api.get<Driver>(adminClient, `/api/v1/admin/drivers/${driverId}`);
  },

  /**
   * Approve a pending driver application
   * POST /api/v1/admin/drivers/:id/approve
   */
  approveDriver: async (driverId: string, data?: ApproveDriverRequest): Promise<Driver> => {
    return api.post<Driver>(adminClient, `/api/v1/admin/drivers/${driverId}/approve`, data);
  },

  /**
   * Reject a pending driver application
   * POST /api/v1/admin/drivers/:id/reject
   */
  rejectDriver: async (driverId: string, data: RejectDriverRequest): Promise<Driver> => {
    return api.post<Driver>(adminClient, `/api/v1/admin/drivers/${driverId}/reject`, data);
  },

  /**
   * Get ride statistics with optional date range
   * GET /api/v1/admin/rides/stats
   */
  getRideStats: async (
    params?: DateRangeFilter
  ): Promise<{
    total_rides: number;
    completed_rides: number;
    cancelled_rides: number;
    total_revenue: number;
    average_fare: number;
    average_rating: number;
  }> => {
    return api.get(adminClient, '/api/v1/admin/rides/stats', params);
  },

  /**
   * Get recent rides
   * GET /api/v1/admin/rides/recent
   */
  getRecentRides: async (
    params?: PaginationParams & {
      status?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<PaginatedResponse<Ride>> => {
    return api.get<PaginatedResponse<Ride>>(adminClient, '/api/v1/admin/rides/recent', params);
  },

  /**
   * Get all rides with filters
   * GET /api/v1/admin/rides
   */
  getRides: async (
    params?: PaginationParams & {
      status?: string;
      rider_id?: string;
      driver_id?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<PaginatedResponse<Ride>> => {
    return api.get<PaginatedResponse<Ride>>(adminClient, '/api/v1/admin/rides', params);
  },

  /**
   * Get ride details by ID
   * GET /api/v1/admin/rides/:id
   */
  getRide: async (rideId: string): Promise<Ride> => {
    return api.get<Ride>(adminClient, `/api/v1/admin/rides/${rideId}`);
  },

  /**
   * Get real-time dashboard metrics
   * GET /api/v1/admin/dashboard/realtime
   */
  getRealtimeMetrics: async (): Promise<RealtimeMetrics> => {
    return api.get<RealtimeMetrics>(adminClient, '/api/v1/admin/dashboard/realtime');
  },

  /**
   * Get comprehensive dashboard summary
   * GET /api/v1/admin/dashboard/summary
   */
  getDashboardSummary: async (params?: {
    period?: 'today' | 'week' | 'month' | 'all';
  }): Promise<DashboardSummary> => {
    return api.get<DashboardSummary>(adminClient, '/api/v1/admin/dashboard/summary', params);
  },

  /**
   * Get revenue trend data
   * GET /api/v1/admin/dashboard/revenue-trend
   */
  getRevenueTrend: async (params?: {
    period?: 'today' | '7days' | '30days' | '90days' | 'year';
    group_by?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<RevenueTrend> => {
    return api.get<RevenueTrend>(adminClient, '/api/v1/admin/dashboard/revenue-trend', params);
  },

  /**
   * Get action items requiring attention
   * GET /api/v1/admin/dashboard/action-items
   */
  getActionItems: async (): Promise<{
    pending_driver_approvals: {
      count: number;
      urgent_count: number;
      items: Array<{
        driver_id: string;
        driver_name: string;
        submitted_at: string;
        days_waiting: number;
      }>;
    };
    fraud_alerts: {
      count: number;
      critical_count: number;
      high_count: number;
      items: Array<{
        alert_id: string;
        alert_type: string;
        alert_level: string;
        user_id: string;
        created_at: string;
      }>;
    };
    negative_feedback: {
      count: number;
      one_star_count: number;
      items: Array<{
        ride_id: string;
        driver_id: string;
        driver_name: string;
        rating: number;
        feedback: string;
        created_at: string;
      }>;
    };
    low_balance_drivers: {
      count: number;
      items: Array<{
        driver_id: string;
        driver_name: string;
        balance: number;
        last_ride: string;
      }>;
    };
    expired_documents: {
      count: number;
      items: Array<{
        driver_id: string;
        driver_name: string;
        document_type: string;
        expired_at: string;
      }>;
    };
  }> => {
    return api.get(adminClient, '/api/v1/admin/dashboard/action-items');
  },

  /**
   * Get recent activity feed
   * GET /api/v1/admin/dashboard/activity-feed
   */
  getActivityFeed: async (
    params?: PaginationParams & {
      types?: string;
    }
  ): Promise<PaginatedResponse<ActivityFeedItem>> => {
    return api.get<PaginatedResponse<ActivityFeedItem>>(
      adminClient,
      '/api/v1/admin/dashboard/activity-feed',
      params
    );
  },
};
