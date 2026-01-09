import { api, fraudClient } from './client';
import {
  PaginatedResponse,
  PaginationParams,
  CreateFraudAlertRequest,
  InvestigateFraudAlertRequest,
  ResolveFraudAlertRequest,
} from '@/lib/types/api';
import { FraudAlert } from '@/lib/types/models';

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
    return api.get<PaginatedResponse<FraudAlert>>(fraudClient, '/api/v1/fraud/alerts', params);
  },

  /**
   * Get fraud alert by ID
   * GET /api/v1/fraud/alerts/:id
   */
  getAlert: async (alertId: string): Promise<FraudAlert> => {
    return api.get<FraudAlert>(fraudClient, `/api/v1/fraud/alerts/${alertId}`);
  },

  /**
   * Create a new fraud alert (admin)
   * POST /api/v1/fraud/alerts
   */
  createAlert: async (data: CreateFraudAlertRequest): Promise<FraudAlert> => {
    return api.post<FraudAlert>(fraudClient, '/api/v1/fraud/alerts', data);
  },

  /**
   * Mark fraud alert as investigating
   * PUT /api/v1/fraud/alerts/:id/investigate
   */
  investigateAlert: async (
    alertId: string,
    data?: InvestigateFraudAlertRequest
  ): Promise<FraudAlert> => {
    return api.put<FraudAlert>(fraudClient, `/api/v1/fraud/alerts/${alertId}/investigate`, data);
  },

  /**
   * Resolve a fraud alert
   * PUT /api/v1/fraud/alerts/:id/resolve
   */
  resolveAlert: async (
    alertId: string,
    data: ResolveFraudAlertRequest
  ): Promise<FraudAlert> => {
    return api.put<FraudAlert>(fraudClient, `/api/v1/fraud/alerts/${alertId}/resolve`, data);
  },

  /**
   * Get all fraud alerts for a specific user
   * GET /api/v1/fraud/users/:id/alerts
   */
  getUserAlerts: async (userId: string): Promise<FraudAlert[]> => {
    return api.get<FraudAlert[]>(fraudClient, `/api/v1/fraud/users/${userId}/alerts`);
  },

  /**
   * Get user risk profile
   * GET /api/v1/fraud/users/:id/risk-profile
   */
  getUserRiskProfile: async (
    userId: string
  ): Promise<{
    user_id: string;
    risk_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    total_alerts: number;
    open_alerts: number;
    resolved_alerts: number;
    suspicious_patterns: string[];
    last_updated: string;
  }> => {
    return api.get(fraudClient, `/api/v1/fraud/users/${userId}/risk-profile`);
  },

  /**
   * Analyze user for fraud (triggers fraud detection algorithms)
   * POST /api/v1/fraud/users/:id/analyze
   */
  analyzeUser: async (
    userId: string
  ): Promise<{
    risk_score: number;
    alerts_created: number;
    patterns_detected: string[];
  }> => {
    return api.post(fraudClient, `/api/v1/fraud/users/${userId}/analyze`);
  },

  /**
   * Suspend user due to fraud
   * POST /api/v1/fraud/users/:id/suspend
   */
  suspendUser: async (
    userId: string,
    data: {
      reason: string;
      alert_ids?: string[];
    }
  ): Promise<{ success: boolean; message: string }> => {
    return api.post(fraudClient, `/api/v1/fraud/users/${userId}/suspend`, data);
  },

  /**
   * Reinstate a suspended user
   * POST /api/v1/fraud/users/:id/reinstate
   */
  reinstateUser: async (
    userId: string,
    data: {
      reason: string;
    }
  ): Promise<{ success: boolean; message: string }> => {
    return api.post(fraudClient, `/api/v1/fraud/users/${userId}/reinstate`, data);
  },

  /**
   * Get fraud statistics
   * GET /api/v1/fraud/stats
   */
  getStats: async (
    params?: {
      start_date?: string;
      end_date?: string;
    }
  ): Promise<{
    total_alerts: number;
    pending_alerts: number;
    investigating_alerts: number;
    resolved_alerts: number;
    high_risk_users: number;
    total_fraud_amount: number;
    alerts_by_type: Record<string, number>;
    alerts_by_level: Record<string, number>;
  }> => {
    return api.get(fraudClient, '/api/v1/fraud/stats', params);
  },
};
