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
};
