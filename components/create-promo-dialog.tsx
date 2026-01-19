'use client';

import { useState } from 'react';
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

export function CreatePromoDialog({ onSuccess }: CreatePromoDialogProps) {
	const [open, setOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		code: '',
		description: '',
		discount_type: 'percentage' as 'percentage' | 'fixed_amount',
		discount_value: '',
		max_discount_amount: '',
		min_ride_amount: '',
		max_uses: '',
		uses_per_user: '1',
		is_active: true,
	});
	const [validFrom, setValidFrom] = useState<Date | undefined>(undefined);
	const [validUntil, setValidUntil] = useState<Date | undefined>(undefined);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			// Validate required fields
			if (!formData.code || !formData.description || !formData.discount_value) {
				toast.error('Please fill in all required fields');
				return;
			}

			if (!validFrom || !validUntil) {
				toast.error('Please select validity dates');
				return;
			}

			// Validate discount value
			const discountValue = parseFloat(formData.discount_value);
			if (formData.discount_type === 'percentage' && discountValue > 100) {
				toast.error('Percentage discount cannot exceed 100%');
				return;
			}

			if (discountValue <= 0) {
				toast.error('Discount value must be greater than 0');
				return;
			}

			// Validate dates
			if (validFrom >= validUntil) {
				toast.error('End date must be after start date');
				return;
			}

			// Convert to API format
			const payload = {
				code: formData.code.toUpperCase().trim(),
				description: formData.description.trim(),
				discount_type: formData.discount_type,
				discount_value: discountValue,
				max_discount_amount: formData.max_discount_amount
					? parseFloat(formData.max_discount_amount)
					: undefined,
				min_ride_amount: formData.min_ride_amount ? parseFloat(formData.min_ride_amount) : undefined,
				max_uses: formData.max_uses ? parseInt(formData.max_uses) : undefined,
				uses_per_user: parseInt(formData.uses_per_user),
				valid_from: validFrom.toISOString(),
				valid_until: validUntil.toISOString(),
				is_active: formData.is_active,
			};

			await promoService.createPromoCode(payload);

			toast.success('Promo code created successfully', {
				description: `Code: ${payload.code}`,
			});

			// Reset form
			setFormData({
				code: '',
				description: '',
				discount_type: 'percentage',
				discount_value: '',
				max_discount_amount: '',
				min_ride_amount: '',
				max_uses: '',
				uses_per_user: '1',
				is_active: true,
			});
			setValidFrom(undefined);
			setValidUntil(undefined);

			setOpen(false);
			onSuccess?.();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to create promo code';
			toast.error('Failed to create promo code', { description: errorMessage });
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
				<Button>
					<IconPlus className='h-4 w-4 mr-2' />
					Create Promo Code
				</Button>
			</DialogTrigger>
			<DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>Create Promo Code</DialogTitle>
					<DialogDescription>
						Create a new promotional discount code for users
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='space-y-4'>
					{/* Code */}
					<div className='space-y-2'>
						<Label htmlFor='code'>
							Promo Code <span className='text-destructive'>*</span>
						</Label>
						<Input
							id='code'
							placeholder='e.g., SUMMER2024'
							value={formData.code}
							onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
							required
						/>
						<p className='text-xs text-muted-foreground'>
							Will be converted to uppercase automatically
						</p>
					</div>

					{/* Description */}
					<div className='space-y-2'>
						<Label htmlFor='description'>
							Description <span className='text-destructive'>*</span>
						</Label>
						<Textarea
							id='description'
							placeholder='Describe the promotion'
							value={formData.description}
							onChange={(e) => handleInputChange('description', e.target.value)}
							required
						/>
					</div>

					{/* Discount Type & Value */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='discount_type'>
								Discount Type <span className='text-destructive'>*</span>
							</Label>
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
							<Label htmlFor='discount_value'>
								Discount Value <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='discount_value'
								type='number'
								step='0.01'
								min='0'
								max={formData.discount_type === 'percentage' ? '100' : undefined}
								placeholder={formData.discount_type === 'percentage' ? 'e.g., 15' : 'e.g., 5.00'}
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
								value={formData.min_ride_amount}
								onChange={(e) => handleInputChange('min_ride_amount', e.target.value)}
							/>
							<p className='text-xs text-muted-foreground'>
								Minimum fare to use promo
							</p>
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
							<p className='text-xs text-muted-foreground'>
								Total redemptions allowed
							</p>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='uses_per_user'>
								Uses Per User <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='uses_per_user'
								type='number'
								min='1'
								value={formData.uses_per_user}
								onChange={(e) => handleInputChange('uses_per_user', e.target.value)}
								required
							/>
							<p className='text-xs text-muted-foreground'>
								Per user limit
							</p>
						</div>
					</div>

					{/* Validity Dates */}
					<div className='grid grid-cols-2 gap-4'>
						<DateTimePicker
							date={validFrom}
							setDate={setValidFrom}
							label={
								<>
									Valid From <span className='text-destructive'>*</span>
								</>
							}
							placeholder='Select start date and time'
						/>
						<DateTimePicker
							date={validUntil}
							setDate={setValidUntil}
							label={
								<>
									Valid Until <span className='text-destructive'>*</span>
								</>
							}
							placeholder='Select end date and time'
						/>
					</div>

					{/* Active Status */}
					<div className='flex items-center space-x-2'>
						<Switch
							id='is_active'
							checked={formData.is_active}
							onCheckedChange={(checked) => handleInputChange('is_active', checked)}
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
