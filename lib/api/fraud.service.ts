import { api, adminClient } from './client';
// Fraud handlers are mounted on admin-service in-process; the standalone
// cmd/fraud service is not deployed.
import { PaginatedResponse, PaginationParams } from '@/lib/types/api';
import {
  FraudAlert,
  UserRiskProfile,
  FraudStatistics,
  FraudPattern,
} from '@/lib/types/models';

/**
 * Fraud Service API Client
 * Connects to Fraud Service (:8092)
 * Admin-only endpoints
 */
export const fraudService = {
  /**
   * Get all fraud alerts
   * GET /api/v1/fraud/alerts
   */
  getAlerts: async (
    params?: PaginationParams & {
      status?: string;
      alert_level?: string;
      alert_type?: string;
    }
  ): Promise<PaginatedResponse<FraudAlert>> => {
    return api.get<PaginatedResponse<FraudAlert>>(adminClient, '/api/v1/admin/fraud/alerts', params);
  },

  /**
   * Get fraud alert by ID
   * GET /api/v1/fraud/alerts/:id
   */
  getAlert: async (alertId: string): Promise<FraudAlert> => {
    return api.get<FraudAlert>(adminClient, `/api/v1/admin/fraud/alerts/${alertId}`);
  },

  /**
   * Create a new fraud alert (admin)
   * POST /api/v1/fraud/alerts
   */
  createAlert: async (data: {
    user_id: string;
    alert_type: string;
    alert_level: string;
    description: string;
    details?: Record<string, unknown>;
  }): Promise<FraudAlert> => {
    return api.post<FraudAlert>(adminClient, '/api/v1/admin/fraud/alerts', data);
  },

  /**
   * Mark fraud alert as investigating
   * PUT /api/v1/fraud/alerts/:id/investigate
   */
  investigateAlert: async (
    alertId: string,
    data?: { notes?: string }
  ): Promise<FraudAlert> => {
    return api.put<FraudAlert>(adminClient, `/api/v1/admin/fraud/alerts/${alertId}/investigate`, data);
  },

  /**
   * Resolve a fraud alert
   * PUT /api/v1/fraud/alerts/:id/resolve
   */
  resolveAlert: async (
    alertId: string,
    data: {
      status: 'confirmed' | 'false_positive';
      action_taken?: string;
      notes?: string;
    }
  ): Promise<FraudAlert> => {
    return api.put<FraudAlert>(adminClient, `/api/v1/admin/fraud/alerts/${alertId}/resolve`, data);
  },

  /**
   * Get all fraud alerts for a specific user
   * GET /api/v1/fraud/users/:user_id/alerts
   */
  getUserAlerts: async (
    userId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<FraudAlert>> => {
    return api.get<PaginatedResponse<FraudAlert>>(
      adminClient,
      `/api/v1/admin/fraud/users/${userId}/alerts`,
      params
    );
  },

  /**
   * Get user risk profile
   * GET /api/v1/fraud/users/:user_id/risk-profile
   */
  getUserRiskProfile: async (userId: string): Promise<UserRiskProfile> => {
    return api.get<UserRiskProfile>(adminClient, `/api/v1/admin/fraud/users/${userId}/risk-profile`);
  },

  /**
   * Analyze user for fraud (triggers fraud detection algorithms)
   * POST /api/v1/fraud/users/:user_id/analyze
   */
  analyzeUser: async (userId: string): Promise<{
    payment_fraud?: {
      risk_score: number;
      alert_created: boolean;
    };
    ride_fraud?: {
      risk_score: number;
      alert_created: boolean;
    };
    account_fraud?: {
      risk_score: number;
      alert_created: boolean;
    };
  }> => {
    return api.post(adminClient, `/api/v1/admin/fraud/users/${userId}/analyze`);
  },

  /**
   * Suspend user due to fraud
   * POST /api/v1/fraud/users/:user_id/suspend
   */
  suspendUser: async (
    userId: string,
    data: {
      reason: string;
      alert_id?: string;
    }
  ): Promise<{ message: string; suspended: boolean }> => {
    return api.post(adminClient, `/api/v1/admin/fraud/users/${userId}/suspend`, data);
  },

  /**
   * Reinstate a suspended user
   * POST /api/v1/fraud/users/:user_id/reinstate
   */
  reinstateUser: async (
    userId: string,
    data?: { notes?: string }
  ): Promise<{ message: string; reinstated: boolean }> => {
    return api.post(adminClient, `/api/v1/admin/fraud/users/${userId}/reinstate`, data);
  },

  /**
   * Trigger payment fraud detection
   * POST /api/v1/fraud/detect/payment/:user_id
   */
  detectPaymentFraud: async (
    userId: string
  ): Promise<{
    risk_score: number;
    alert_created: boolean;
    alert_id?: string;
  }> => {
    return api.post(adminClient, `/api/v1/admin/fraud/detect/payment/${userId}`);
  },

  /**
   * Trigger ride fraud detection
   * POST /api/v1/fraud/detect/ride/:user_id
   */
  detectRideFraud: async (
    userId: string
  ): Promise<{
    risk_score: number;
    alert_created: boolean;
    alert_id?: string;
  }> => {
    return api.post(adminClient, `/api/v1/admin/fraud/detect/ride/${userId}`);
  },

  /**
   * Trigger account fraud detection
   * POST /api/v1/fraud/detect/account/:user_id
   */
  detectAccountFraud: async (
    userId: string
  ): Promise<{
    risk_score: number;
    alert_created: boolean;
    alert_id?: string;
  }> => {
    return api.post(adminClient, `/api/v1/admin/fraud/detect/account/${userId}`);
  },

  /**
   * Get fraud statistics
   * GET /api/v1/fraud/statistics
   */
  getStatistics: async (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<FraudStatistics> => {
    return api.get<FraudStatistics>(adminClient, '/api/v1/admin/fraud/statistics', params);
  },

  /**
   * Get fraud patterns
   * GET /api/v1/fraud/patterns
   */
  getPatterns: async (params?: { limit?: number }): Promise<FraudPattern[]> => {
    return api.get<FraudPattern[]>(adminClient, '/api/v1/admin/fraud/patterns', params);
  },
};
