import { adminClient } from './client';
import { PaginationMeta } from '@/lib/types/api';
import {
  Vehicle,
  VehicleStats,
  VehicleListParams,
  ReviewVehicleRequest,
  SuspendVehicleRequest,
} from '@/lib/types/vehicles';

async function listVehicles(url: string, params?: Record<string, unknown>): Promise<{ data: Vehicle[]; meta: PaginationMeta }> {
  const response = await adminClient.get(url, { params });
  return {
    data: (response.data.data?.vehicles ?? []) as Vehicle[],
    meta: response.data.meta as PaginationMeta,
  };
}

export const vehiclesService = {
  /**
   * List all vehicles with optional filters
   * GET /api/v1/admin/vehicles
   */
  getAll: async (params?: VehicleListParams): Promise<{ data: Vehicle[]; meta: PaginationMeta }> => {
    return listVehicles('/api/v1/admin/vehicles', params as Record<string, unknown>);
  },

  /**
   * Get vehicles pending admin review
   * GET /api/v1/admin/vehicles/pending
   */
  getPending: async (params?: { limit?: number; offset?: number }): Promise<{ data: Vehicle[]; meta: PaginationMeta }> => {
    return listVehicles('/api/v1/admin/vehicles/pending', params as Record<string, unknown>);
  },

  /**
   * Get vehicle statistics
   * GET /api/v1/admin/vehicles/stats
   */
  getStats: async (): Promise<VehicleStats> => {
    const response = await adminClient.get('/api/v1/admin/vehicles/stats');
    return response.data.data as VehicleStats;
  },

  /**
   * Get vehicles with expiring documents
   * GET /api/v1/admin/vehicles/expiring
   */
  getExpiring: async (params?: { days?: number }): Promise<{ vehicles: Vehicle[]; count: number; days: number }> => {
    const response = await adminClient.get('/api/v1/admin/vehicles/expiring', { params });
    return response.data.data as { vehicles: Vehicle[]; count: number; days: number };
  },

  /**
   * Approve or reject a vehicle
   * POST /api/v1/admin/vehicles/:id/review
   */
  reviewVehicle: async (id: string, data: ReviewVehicleRequest): Promise<void> => {
    await adminClient.post(`/api/v1/admin/vehicles/${id}/review`, data);
  },

  /**
   * Suspend a vehicle
   * POST /api/v1/admin/vehicles/:id/suspend
   */
  suspendVehicle: async (id: string, data: SuspendVehicleRequest): Promise<void> => {
    await adminClient.post(`/api/v1/admin/vehicles/${id}/suspend`, data);
  },
};
