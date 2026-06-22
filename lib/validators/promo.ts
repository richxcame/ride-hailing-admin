import { z } from 'zod';
import { PromoCode } from '@/lib/types/models';

// Shared validation for the create + edit promo forms. Numeric fields are kept
// as strings (raw input value) and parsed in promoFormToPayload; cross-field
// rules live in refinements so each error lands on the right field inline.
export const promoSchema = z
	.object({
		code: z.string().trim().min(1, 'Promo code is required'),
		description: z.string().trim().min(1, 'Description is required'),
		discount_type: z.enum(['percentage', 'fixed_amount']),
		discount_value: z.string().min(1, 'Discount value is required'),
		max_discount_amount: z.string(),
		min_ride_amount: z.string(),
		max_uses: z.string(),
		uses_per_user: z.string().min(1, 'Required'),
		is_active: z.boolean(),
		valid_from: z.date().optional(),
		valid_until: z.date().optional(),
	})
	.refine((d) => Number(d.discount_value) > 0, {
		message: 'Must be greater than 0',
		path: ['discount_value'],
	})
	.refine((d) => d.discount_type !== 'percentage' || Number(d.discount_value) <= 100, {
		message: 'Percentage discount cannot exceed 100%',
		path: ['discount_value'],
	})
	.refine((d) => !!d.valid_from, { message: 'Select a start date', path: ['valid_from'] })
	.refine((d) => !!d.valid_until, { message: 'Select an end date', path: ['valid_until'] })
	.refine((d) => !d.valid_from || !d.valid_until || d.valid_until > d.valid_from, {
		message: 'End date must be after the start date',
		path: ['valid_until'],
	});

export type PromoFormValues = z.infer<typeof promoSchema>;

export const PROMO_DEFAULTS: PromoFormValues = {
	code: '',
	description: '',
	discount_type: 'percentage',
	discount_value: '',
	max_discount_amount: '',
	min_ride_amount: '',
	max_uses: '',
	uses_per_user: '1',
	is_active: true,
	valid_from: undefined,
	valid_until: undefined,
};

/** Map an existing promo into editable form values. */
export function promoToFormValues(promo: PromoCode): PromoFormValues {
	return {
		code: promo.code,
		description: promo.description,
		discount_type: promo.discount_type as 'percentage' | 'fixed_amount',
		discount_value: promo.discount_value.toString(),
		max_discount_amount: promo.max_discount_amount?.toString() ?? '',
		min_ride_amount: promo.min_ride_amount?.toString() ?? '',
		max_uses: promo.max_uses?.toString() ?? '',
		uses_per_user: promo.uses_per_user.toString(),
		is_active: promo.is_active,
		valid_from: new Date(promo.valid_from),
		valid_until: new Date(promo.valid_until),
	};
}

/** Convert validated form values into the create/update API payload. */
export function promoFormToPayload(v: PromoFormValues) {
	return {
		code: v.code.toUpperCase().trim(),
		description: v.description.trim(),
		discount_type: v.discount_type,
		discount_value: Number(v.discount_value),
		max_discount_amount: v.max_discount_amount ? Number(v.max_discount_amount) : undefined,
		min_ride_amount: v.min_ride_amount ? Number(v.min_ride_amount) : undefined,
		max_uses: v.max_uses ? parseInt(v.max_uses, 10) : undefined,
		uses_per_user: parseInt(v.uses_per_user, 10),
		// Guaranteed present by the schema refinements above.
		valid_from: v.valid_from!.toISOString(),
		valid_until: v.valid_until!.toISOString(),
		is_active: v.is_active,
	};
}
