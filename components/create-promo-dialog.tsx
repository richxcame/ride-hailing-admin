'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { IconPlus } from '@tabler/icons-react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { promoService } from '@/lib/api/promo.service';
import { DateTimePicker } from './date-time-picker';

interface CreatePromoDialogProps {
	onSuccess?: () => void;
}

// Numeric fields stay as strings (raw input value); they're parsed on submit.
// Cross-field rules (percentage cap, date ordering) live in refinements so the
// error lands on the right field inline.
const promoSchema = z
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

type PromoFormValues = z.infer<typeof promoSchema>;

const DEFAULTS: PromoFormValues = {
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

export function CreatePromoDialog({ onSuccess }: CreatePromoDialogProps) {
	const [open, setOpen] = useState(false);
	const {
		register,
		handleSubmit,
		control,
		reset,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<PromoFormValues>({
		resolver: zodResolver(promoSchema),
		defaultValues: DEFAULTS,
	});

	const discountType = watch('discount_type');

	const onSubmit = async (v: PromoFormValues) => {
		try {
			const payload = {
				code: v.code.toUpperCase().trim(),
				description: v.description.trim(),
				discount_type: v.discount_type,
				discount_value: Number(v.discount_value),
				max_discount_amount: v.max_discount_amount ? Number(v.max_discount_amount) : undefined,
				min_ride_amount: v.min_ride_amount ? Number(v.min_ride_amount) : undefined,
				max_uses: v.max_uses ? parseInt(v.max_uses, 10) : undefined,
				uses_per_user: parseInt(v.uses_per_user, 10),
				valid_from: v.valid_from!.toISOString(),
				valid_until: v.valid_until!.toISOString(),
				is_active: v.is_active,
			};

			await promoService.createPromoCode(payload);
			toast.success('Promo code created successfully', { description: `Code: ${payload.code}` });
			reset(DEFAULTS);
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to create promo code';
			toast.error('Failed to create promo code', { description: errorMessage });
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) reset(DEFAULTS);
			}}
		>
			<DialogTrigger asChild>
				<Button>
					<IconPlus className='h-4 w-4 mr-2' />
					Create Promo Code
				</Button>
			</DialogTrigger>
			<DialogContent size='lg'>
				<DialogHeader>
					<DialogTitle>Create Promo Code</DialogTitle>
					<DialogDescription>
						Create a new promotional discount code for users
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
					{/* Code */}
					<div className='space-y-2'>
						<Label htmlFor='code'>
							Promo Code <span className='text-destructive'>*</span>
						</Label>
						<Controller
							control={control}
							name='code'
							render={({ field }) => (
								<Input
									id='code'
									placeholder='e.g., SUMMER2024'
									aria-invalid={!!errors.code}
									value={field.value}
									onChange={(e) => field.onChange(e.target.value.toUpperCase())}
								/>
							)}
						/>
						{errors.code ? (
							<p className='text-xs text-destructive'>{errors.code.message}</p>
						) : (
							<p className='text-xs text-muted-foreground'>
								Will be converted to uppercase automatically
							</p>
						)}
					</div>

					{/* Description */}
					<div className='space-y-2'>
						<Label htmlFor='description'>
							Description <span className='text-destructive'>*</span>
						</Label>
						<Textarea
							id='description'
							placeholder='Describe the promotion'
							aria-invalid={!!errors.description}
							{...register('description')}
						/>
						{errors.description && (
							<p className='text-xs text-destructive'>{errors.description.message}</p>
						)}
					</div>

					{/* Discount Type & Value */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='discount_type'>
								Discount Type <span className='text-destructive'>*</span>
							</Label>
							<Controller
								control={control}
								name='discount_type'
								render={({ field }) => (
									<Select value={field.value} onValueChange={field.onChange}>
										<SelectTrigger id='discount_type'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='percentage'>Percentage (%)</SelectItem>
											<SelectItem value='fixed_amount'>Fixed Amount ($)</SelectItem>
										</SelectContent>
									</Select>
								)}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='discount_value'>
								Discount Value <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='discount_value'
								type='number'
								step='0.01'
								min='0'
								max={discountType === 'percentage' ? '100' : undefined}
								placeholder={discountType === 'percentage' ? 'e.g., 15' : 'e.g., 5.00'}
								aria-invalid={!!errors.discount_value}
								{...register('discount_value')}
							/>
							{errors.discount_value && (
								<p className='text-xs text-destructive'>{errors.discount_value.message}</p>
							)}
						</div>
					</div>

					{/* Max Discount & Min Ride Amount */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='max_discount_amount'>Max Discount Amount ($)</Label>
							<Input
								id='max_discount_amount'
								type='number'
								step='0.01'
								min='0'
								placeholder='Optional'
								{...register('max_discount_amount')}
							/>
							<p className='text-xs text-muted-foreground'>
								Maximum discount cap (for percentage)
							</p>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='min_ride_amount'>Min Ride Amount ($)</Label>
							<Input
								id='min_ride_amount'
								type='number'
								step='0.01'
								min='0'
								placeholder='Optional'
								{...register('min_ride_amount')}
							/>
							<p className='text-xs text-muted-foreground'>Minimum fare to use promo</p>
						</div>
					</div>

					{/* Usage Limits */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='max_uses'>Max Total Uses</Label>
							<Input
								id='max_uses'
								type='number'
								min='1'
								placeholder='Unlimited'
								{...register('max_uses')}
							/>
							<p className='text-xs text-muted-foreground'>Total redemptions allowed</p>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='uses_per_user'>
								Uses Per User <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='uses_per_user'
								type='number'
								min='1'
								aria-invalid={!!errors.uses_per_user}
								{...register('uses_per_user')}
							/>
							{errors.uses_per_user ? (
								<p className='text-xs text-destructive'>{errors.uses_per_user.message}</p>
							) : (
								<p className='text-xs text-muted-foreground'>Per user limit</p>
							)}
						</div>
					</div>

					{/* Validity Dates */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-1'>
							<Controller
								control={control}
								name='valid_from'
								render={({ field }) => (
									<DateTimePicker
										date={field.value}
										setDate={(d) => field.onChange(d)}
										label={
											<>
												Valid From <span className='text-destructive'>*</span>
											</>
										}
										placeholder='Select start date and time'
									/>
								)}
							/>
							{errors.valid_from && (
								<p className='text-xs text-destructive'>{errors.valid_from.message}</p>
							)}
						</div>
						<div className='space-y-1'>
							<Controller
								control={control}
								name='valid_until'
								render={({ field }) => (
									<DateTimePicker
										date={field.value}
										setDate={(d) => field.onChange(d)}
										label={
											<>
												Valid Until <span className='text-destructive'>*</span>
											</>
										}
										placeholder='Select end date and time'
									/>
								)}
							/>
							{errors.valid_until && (
								<p className='text-xs text-destructive'>{errors.valid_until.message}</p>
							)}
						</div>
					</div>

					{/* Active Status */}
					<div className='flex items-center space-x-2'>
						<Controller
							control={control}
							name='is_active'
							render={({ field }) => (
								<Switch
									id='is_active'
									checked={field.value}
									onCheckedChange={field.onChange}
								/>
							)}
						/>
						<Label htmlFor='is_active' className='cursor-pointer'>
							Active (users can use this promo code immediately)
						</Label>
					</div>

					<DialogFooter>
						<Button type='button' variant='outline' onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button type='submit' disabled={isSubmitting}>
							{isSubmitting ? 'Creating...' : 'Create Promo Code'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
