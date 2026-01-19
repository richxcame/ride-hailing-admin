import { api, promosClient } from './client';
import { PromoCode, RideType, PromoCodeValidation } from '@/lib/types/models';

/**
 * Promo Service API Client
 * Connects to Promos Service (:8089)
 */
export const promoService = {
  /**
   * Get all ride types (public endpoint)
   * GET /api/v1/ride-types
   */
  getRideTypes: async (): Promise<RideType[]> => {
    return api.get<RideType[]>(promosClient, '/api/v1/ride-types');
  },

  /**
   * Calculate fare for a ride type (public endpoint)
   * POST /api/v1/ride-types/calculate-fare
   */
  calculateFare: async (data: {
    ride_type_id: string;
    distance: number;
    duration: number;
    surge_multiplier?: number;
  }): Promise<{
    fare: number;
    distance: number;
    duration: number;
    surge_multiplier: number;
  }> => {
    return api.post(promosClient, '/api/v1/ride-types/calculate-fare', data);
  },

  /**
   * Create a new promo code (admin only)
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
    return api.post<PromoCode>(promosClient, '/api/v1/admin/promo-codes', data);
  },

  /**
   * Validate a promo code (authenticated)
   * POST /api/v1/promo-codes/validate
   */
  validatePromoCode: async (data: {
    code: string;
    ride_amount: number;
  }): Promise<PromoCodeValidation> => {
    return api.post<PromoCodeValidation>(promosClient, '/api/v1/promo-codes/validate', data);
  },

  /**
   * Get my referral code
   * GET /api/v1/referrals/my-code
   */
  getMyReferralCode: async (): Promise<{
    id: string;
    user_id: string;
    code: string;
    total_referrals: number;
    total_earnings: number;
    created_at: string;
  }> => {
    return api.get(promosClient, '/api/v1/referrals/my-code');
  },

  /**
   * Apply a referral code
   * POST /api/v1/referrals/apply
   */
  applyReferralCode: async (data: {
    referral_code: string;
  }): Promise<{
    message: string;
    bonus: number;
  }> => {
    return api.post(promosClient, '/api/v1/referrals/apply', data);
  },

  /**
   * Get all promo codes (admin only)
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
    return api.get(promosClient, '/api/v1/admin/promo-codes', params);
  },

  /**
   * Get all referral codes (admin only)
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
    return api.get(promosClient, '/api/v1/admin/referral-codes', params);
  },

  /**
   * Get a specific promo code by ID (admin only)
   * GET /api/v1/admin/promo-codes/:id
   */
  getPromoCode: async (promoId: string): Promise<PromoCode> => {
    return api.get<PromoCode>(promosClient, `/api/v1/admin/promo-codes/${promoId}`);
  },

  /**
   * Update a promo code (admin only)
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
    return api.patch<PromoCode>(promosClient, `/api/v1/admin/promo-codes/${promoId}`, data);
  },

  /**
   * Deactivate a promo code (admin only)
   * DELETE /api/v1/admin/promo-codes/:id
   */
  deactivatePromoCode: async (promoId: string): Promise<{ message: string }> => {
    return api.delete<{ message: string }>(promosClient, `/api/v1/admin/promo-codes/${promoId}`);
  },

  /**
   * Get promo code usage statistics (admin only)
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
    return api.get(promosClient, `/api/v1/admin/promo-codes/${promoId}/usage`);
  },

  /**
   * Get referral details (admin only)
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
    return api.get(promosClient, `/api/v1/admin/referrals/${referralId}`);
  },

  /**
   * Get my referral earnings (authenticated user)
   * GET /api/v1/referrals/my-earnings
   */
  getMyReferralEarnings: async (): Promise<{
    total_referrals: number;
    total_earnings: number;
    pending_earnings: number;
    completed_referrals: number;
    referral_code: string;
  }> => {
    return api.get(promosClient, '/api/v1/referrals/my-earnings');
  },
};
