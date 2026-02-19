import { adminClient } from './client';
import {
  BackgroundCheck,
  DriverVerificationStatus,
  InitiateBackgroundCheckRequest,
  ReviewBackgroundCheckRequest,
} from '@/lib/types/verification';

export const verificationService = {
  /**
   * Initiate a background check for a driver
   * POST /api/v1/admin/verification/background
   */
  initiateCheck: async (data: InitiateBackgroundCheckRequest): Promise<BackgroundCheck> => {
    const response = await adminClient.post('/api/v1/admin/verification/background', data);
    return (response.data.data?.check ?? response.data.data) as BackgroundCheck;
  },

  /**
   * Get a background check by its ID
   * GET /api/v1/admin/verification/background/:id
   */
  getCheckById: async (checkId: string): Promise<BackgroundCheck> => {
    const response = await adminClient.get(`/api/v1/admin/verification/background/${checkId}`);
    return (response.data.data?.check ?? response.data.data) as BackgroundCheck;
  },

  /**
   * Review (pass or fail) a background check
   * PATCH /api/v1/admin/verification/background/:id/review
   */
  reviewCheck: async (checkId: string, data: ReviewBackgroundCheckRequest): Promise<void> => {
    await adminClient.patch(`/api/v1/admin/verification/background/${checkId}/review`, data);
  },

  /**
   * Get a driver's background check
   * GET /api/v1/admin/verification/driver/:id/background
   */
  getDriverBackgroundCheck: async (driverId: string): Promise<BackgroundCheck | null> => {
    try {
      const response = await adminClient.get(`/api/v1/admin/verification/driver/${driverId}/background`);
      return (response.data.data?.check ?? response.data.data ?? null) as BackgroundCheck | null;
    } catch {
      return null;
    }
  },

  /**
   * Get a driver's full verification status
   * GET /api/v1/admin/verification/driver/:id/status
   */
  getDriverVerificationStatus: async (driverId: string): Promise<DriverVerificationStatus | null> => {
    try {
      const response = await adminClient.get(`/api/v1/admin/verification/driver/${driverId}/status`);
      return (response.data.data ?? null) as DriverVerificationStatus | null;
    } catch {
      return null;
    }
  },
};
