import { api, adminClient } from './client';
import {
  PaginatedResponse,
  PaginationParams,
  SuspendUserRequest,
  ApproveDriverRequest,
  RejectDriverRequest,
  DateRangeFilter,
} from '@/lib/types/api';
import { User, Driver, Ride, DashboardStats } from '@/lib/types/models';

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
  getRecentRides: async (params?: PaginationParams): Promise<PaginatedResponse<Ride>> => {
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
};
