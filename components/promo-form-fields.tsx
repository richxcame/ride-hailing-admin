'use client';

import { Control, Controller, FieldErrors, UseFormRegister } from 'react-hook-form';
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
import { DateTimePicker } from './date-time-picker';
import type { PromoFormValues } from '@/lib/validators/promo';

interface PromoFormFieldsProps {
	register: UseFormRegister<PromoFormValues>;
	control: Control<PromoFormValues>;
	errors: FieldErrors<PromoFormValues>;
	/** Watched discount_type — drives the value placeholder / max. */
	discountType: PromoFormValues['discount_type'];
}

// Shared field layout for the create + edit promo dialogs. The parent owns the
// react-hook-form instance and passes its register/control/errors in.
export function PromoFormFields({ register, control, errors, discountType }: PromoFormFieldsProps) {
	return (
		<>
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
					<p className='text-xs text-muted-foreground'>Maximum discount cap (for percentage)</p>
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
						<Switch id='is_active' checked={field.value} onCheckedChange={field.onChange} />
					)}
				/>
				<Label htmlFor='is_active' className='cursor-pointer'>
					Active (users can use this promo code immediately)
				</Label>
			</div>
		</>
	);
}
