'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { IconEdit } from '@tabler/icons-react';
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
import { PromoCode } from '@/lib/types/models';

interface EditPromoDialogProps {
	promo: PromoCode;
	onSuccess?: () => void;
	trigger?: React.ReactNode;
}

export function EditPromoDialog({ promo, onSuccess, trigger }: EditPromoDialogProps) {
	const [open, setOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		code: promo.code,
		description: promo.description,
		discount_type: promo.discount_type as 'percentage' | 'fixed_amount',
		discount_value: promo.discount_value.toString(),
		max_discount_amount: promo.max_discount_amount?.toString() || '',
		min_ride_amount: promo.min_ride_amount?.toString() || '',
		max_uses: promo.max_uses?.toString() || '',
		uses_per_user: promo.uses_per_user.toString(),
		valid_from: new Date(promo.valid_from).toISOString().slice(0, 16),
		valid_until: new Date(promo.valid_until).toISOString().slice(0, 16),
		is_active: promo.is_active,
	});

	useEffect(() => {
		if (open) {
			setFormData({
				code: promo.code,
				description: promo.description,
				discount_type: promo.discount_type as 'percentage' | 'fixed_amount',
				discount_value: promo.discount_value.toString(),
				max_discount_amount: promo.max_discount_amount?.toString() || '',
				min_ride_amount: promo.min_ride_amount?.toString() || '',
				max_uses: promo.max_uses?.toString() || '',
				uses_per_user: promo.uses_per_user.toString(),
				valid_from: new Date(promo.valid_from).toISOString().slice(0, 16),
				valid_until: new Date(promo.valid_until).toISOString().slice(0, 16),
				is_active: promo.is_active,
			});
		}
	}, [open, promo]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const payload = {
				code: formData.code.toUpperCase().trim(),
				description: formData.description.trim(),
				discount_type: formData.discount_type,
				discount_value: parseFloat(formData.discount_value),
				max_discount_amount: formData.max_discount_amount
					? parseFloat(formData.max_discount_amount)
					: undefined,
				min_ride_amount: formData.min_ride_amount ? parseFloat(formData.min_ride_amount) : undefined,
				max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined,
				uses_per_user: parseInt(formData.uses_per_user),
				valid_from: new Date(formData.valid_from).toISOString(),
				valid_until: new Date(formData.valid_until).toISOString(),
				is_active: formData.is_active,
			};

			// Validate discount value
			if (formData.discount_type === 'percentage' && payload.discount_value > 100) {
				toast.error('Percentage discount cannot exceed 100%');
				return;
			}

			if (payload.discount_value <= 0) {
				toast.error('Discount value must be greater than 0');
				return;
			}

			// Validate dates
			const validFrom = new Date(formData.valid_from);
			const validUntil = new Date(formData.valid_until);
			if (validFrom >= validUntil) {
				toast.error('End date must be after start date');
				return;
			}

			await promoService.updatePromoCode(promo.id, payload);

			toast.success('Promo code updated successfully', {
				description: `Code: ${payload.code}`,
			});

			setOpen(false);
			onSuccess?.();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to update promo code';
			toast.error('Failed to update promo code', { description: errorMessage });
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant='outline' size='sm'>
						<IconEdit className='h-4 w-4 mr-2' />
						Edit
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Edit Promo Code</DialogTitle>
					<DialogDescription>Update the promotional discount code details</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='space-y-4'>
					{/* Code */}
					<div className='space-y-2'>
						<Label htmlFor='code'>Promo Code</Label>
						<Input
							id='code'
							value={formData.code}
							onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
							required
						/>
					</div>

					{/* Description */}
					<div className='space-y-2'>
						<Label htmlFor='description'>Description</Label>
						<Textarea
							id='description'
							value={formData.description}
							onChange={(e) => handleInputChange('description', e.target.value)}
							required
						/>
					</div>

					{/* Discount Type & Value */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='discount_type'>Discount Type</Label>
							<Select
								value={formData.discount_type}
								onValueChange={(value) =>
									handleInputChange('discount_type', value as 'percentage' | 'fixed_amount')
								}
							>
								<SelectTrigger id='discount_type'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='percentage'>Percentage (%)</SelectItem>
									<SelectItem value='fixed_amount'>Fixed Amount ($)</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='discount_value'>Discount Value</Label>
							<Input
								id='discount_value'
								type='number'
								step='0.01'
								min='0'
								max={formData.discount_type === 'percentage' ? '100' : undefined}
								value={formData.discount_value}
								onChange={(e) => handleInputChange('discount_value', e.target.value)}
								required
							/>
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
								value={formData.max_discount_amount}
								onChange={(e) => handleInputChange('max_discount_amount', e.target.value)}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='min_ride_amount'>Min Ride Amount ($)</Label>
							<Input
								id='min_ride_amount'
								type='number'
								step='0.01'
								min='0'
								placeholder='Optional'
								value={formData.min_ride_amount}
								onChange={(e) => handleInputChange('min_ride_amount', e.target.value)}
							/>
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
								value={formData.max_uses}
								onChange={(e) => handleInputChange('max_uses', e.target.value)}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='uses_per_user'>Uses Per User</Label>
							<Input
								id='uses_per_user'
								type='number'
								min='1'
								value={formData.uses_per_user}
								onChange={(e) => handleInputChange('uses_per_user', e.target.value)}
								required
							/>
						</div>
					</div>

					{/* Validity Dates */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='valid_from'>Valid From</Label>
							<Input
								id='valid_from'
								type='datetime-local'
								value={formData.valid_from}
								onChange={(e) => handleInputChange('valid_from', e.target.value)}
								required
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='valid_until'>Valid Until</Label>
							<Input
								id='valid_until'
								type='datetime-local'
								value={formData.valid_until}
								onChange={(e) => handleInputChange('valid_until', e.target.value)}
								required
							/>
						</div>
					</div>

					{/* Active Status */}
					<div className='flex items-center space-x-2'>
						<Switch
							id='is_active'
							checked={formData.is_active}
							onCheckedChange={(checked) => handleInputChange('is_active', checked)}
						/>
						<Label htmlFor='is_active' className='cursor-pointer'>
							Active
						</Label>
					</div>

					<DialogFooter>
						<Button type='button' variant='outline' onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button type='submit' disabled={isSubmitting}>
							{isSubmitting ? 'Updating...' : 'Update Promo Code'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
