import { api, adminClient } from './client';
import { PromoCode, PromoRideType } from '@/lib/types/models';

/**
 * Promo Service API Client
 * Talks to admin-service (port 8088 in dev), which mounts internal/promos and
 * internal/ridetypes in-process under the /api/v1/admin group.
 *
 * Only admin-only endpoints live here. The previous user-facing methods
 * (validatePromoCode, applyReferralCode, getMyReferralCode, etc.) are not
 * exposed by admin-service and were never called from the admin UI.
 */
export const promoService = {
  /**
   * Get all ride types — used by the promo page to scope codes to ride types.
   * GET /api/v1/admin/ride-types
   */
  getRideTypes: async (): Promise<PromoRideType[]> => {
    return api.get<PromoRideType[]>(adminClient, '/api/v1/admin/ride-types');
  },

  /**
   * Create a new promo code.
   * POST /api/v1/admin/promo-codes
   */
  createPromoCode: async (data: {
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    max_discount_amount?: number;
    min_ride_amount?: number;
    max_uses?: number;
    uses_per_user: number;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
  }): Promise<PromoCode> => {
    return api.post<PromoCode>(adminClient, '/api/v1/admin/promo-codes', data);
  },

  /**
   * List all promo codes.
   * GET /api/v1/admin/promo-codes
   */
  getAllPromoCodes: async (params?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    data: PromoCode[];
    meta: {
      total: number;
      limit: number;
      offset: number;
    };
  }> => {
    return api.get(adminClient, '/api/v1/admin/promo-codes', params);
  },

  /**
   * List all referral codes.
   * GET /api/v1/admin/referral-codes
   */
  getAllReferralCodes: async (params?: {
    limit?: number;
    offset?: number;
  }): Promise<{
    data: Array<{
      id: string;
      user_id: string;
      code: string;
      total_referrals: number;
      total_earnings: number;
      created_at: string;
      updated_at: string;
    }>;
    meta: {
      total: number;
      limit: number;
      offset: number;
    };
  }> => {
    return api.get(adminClient, '/api/v1/admin/referral-codes', params);
  },

  /**
   * Get a specific promo code by ID.
   * GET /api/v1/admin/promo-codes/:id
   */
  getPromoCode: async (promoId: string): Promise<PromoCode> => {
    return api.get<PromoCode>(adminClient, `/api/v1/admin/promo-codes/${promoId}`);
  },

  /**
   * Update a promo code.
   * PATCH /api/v1/admin/promo-codes/:id
   */
  updatePromoCode: async (
    promoId: string,
    data: {
      code?: string;
      description?: string;
      discount_type?: 'percentage' | 'fixed_amount';
      discount_value?: number;
      max_discount_amount?: number;
      min_ride_amount?: number;
      max_uses?: number;
      uses_per_user?: number;
      valid_from?: string;
      valid_until?: string;
      is_active?: boolean;
    }
  ): Promise<PromoCode> => {
    return api.patch<PromoCode>(adminClient, `/api/v1/admin/promo-codes/${promoId}`, data);
  },

  /**
   * Deactivate a promo code.
   * DELETE /api/v1/admin/promo-codes/:id
   */
  deactivatePromoCode: async (promoId: string): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(adminClient, `/api/v1/admin/promo-codes/${promoId}`);
  },

  /**
   * Get promo code usage statistics.
   * GET /api/v1/admin/promo-codes/:id/usage
   */
  getPromoCodeUsageStats: async (promoId: string): Promise<{
    promo_code: PromoCode;
    total_discount_given: number;
    unique_users: number;
    recent_uses: Array<{
      user_id: string;
      ride_id: string;
      discount_amount: number;
      used_at: string;
    }>;
  }> => {
    return api.get(adminClient, `/api/v1/admin/promo-codes/${promoId}/usage`);
  },

  /**
   * Get referral details by ID.
   * GET /api/v1/admin/referrals/:id
   */
  getReferralDetails: async (referralId: string): Promise<{
    id: string;
    referrer_id: string;
    referred_id: string;
    referral_code_id: string;
    referrer_bonus_amount: number;
    referred_bonus_amount: number;
    referrer_bonus_applied: boolean;
    referred_bonus_applied: boolean;
    referred_first_ride_id?: string;
    completed_at?: string;
    created_at: string;
  }> => {
    return api.get(adminClient, `/api/v1/admin/referrals/${referralId}`);
  },
};
