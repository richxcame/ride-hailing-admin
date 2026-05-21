'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type {
	Country,
	CreateCountryRequest,
	UpdateCountryRequest,
} from '@/lib/types/geography';

interface CountryFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData?: Country | null;
	onSubmit: (data: CreateCountryRequest | UpdateCountryRequest) => Promise<void>;
}

export function CountryFormDialog({
	open,
	onOpenChange,
	initialData,
	onSubmit,
}: CountryFormDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		name: initialData?.name || '',
		native_name: initialData?.native_name || '',
		code: initialData?.code || '',
		code3: initialData?.code3 || '',
		currency_code: initialData?.currency_code || '',
		default_language: initialData?.default_language || '',
		phone_prefix: initialData?.phone_prefix || '',
		timezone: initialData?.timezone || '',
		is_active: initialData?.is_active ?? true,
	});

	const getInitialMethods = (data?: Country | null): string[] => {
		// Backend returns/accepts a flat string array; default to ['cash'].
		return data?.payment_methods?.length ? data.payment_methods : ['cash'];
	};

	const [paymentMethods, setPaymentMethods] = useState<string[]>(getInitialMethods(initialData));

	// Reset form state to initialData when the dialog opens. See
	// https://react.dev/learn/you-might-not-need-an-effect.
	/* eslint-disable react-hooks/set-state-in-effect */
	useEffect(() => {
		if (open) {
			setFormData({
				name: initialData?.name || '',
				native_name: initialData?.native_name || '',
				code: initialData?.code || '',
				code3: initialData?.code3 || '',
				currency_code: initialData?.currency_code || '',
				default_language: initialData?.default_language || '',
				phone_prefix: initialData?.phone_prefix || '',
				timezone: initialData?.timezone || '',
				is_active: initialData?.is_active ?? true,
			});
			setPaymentMethods(getInitialMethods(initialData));
		}
	}, [open, initialData]);
	/* eslint-enable react-hooks/set-state-in-effect */

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const togglePaymentMethod = (method: string) => {
		setPaymentMethods((prev) =>
			prev.includes(method)
				? prev.filter((m) => m !== method)
				: [...prev, method]
		);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			if (
				!formData.name ||
				!formData.code ||
				!formData.code3 ||
				!formData.currency_code ||
				!formData.phone_prefix ||
				!formData.timezone
			) {
				toast.error('Please fill in all required fields');
				return;
			}

			const payload: CreateCountryRequest = {
				name: formData.name.trim(),
				native_name: formData.native_name.trim(),
				code: formData.code.toUpperCase().trim(),
				code3: formData.code3.toUpperCase().trim(),
				currency_code: formData.currency_code.toUpperCase().trim(),
				default_language: formData.default_language.trim(),
				phone_prefix: formData.phone_prefix.trim(),
				timezone: formData.timezone.trim(),
				is_active: formData.is_active,
				payment_methods: paymentMethods,
			};

			await onSubmit(payload);

			toast.success(
				initialData
					? 'Country updated successfully'
					: 'Country created successfully',
				{
					description: payload.name,
				}
			);

			onOpenChange(false);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: initialData
						? 'Failed to update country'
						: 'Failed to create country';
			toast.error(
				initialData ? 'Failed to update country' : 'Failed to create country',
				{ description: errorMessage }
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle>
						{initialData ? 'Edit Country' : 'Add Country'}
					</DialogTitle>
					<DialogDescription>
						{initialData
							? 'Update country details'
							: 'Add a new country to the platform'}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='space-y-4'>
					{/* Name & Native Name */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='name'>
								Name <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='name'
								placeholder='Turkmenistan'
								value={formData.name}
								onChange={(e) => handleInputChange('name', e.target.value)}
								required
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='native_name'>Native Name</Label>
							<Input
								id='native_name'
								placeholder='Türkmenistan'
								value={formData.native_name}
								onChange={(e) =>
									handleInputChange('native_name', e.target.value)
								}
							/>
						</div>
					</div>

					{/* ISO Codes */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='code'>
								ISO Code (2-letter) <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='code'
								placeholder='TM'
								maxLength={2}
								value={formData.code}
								onChange={(e) =>
									handleInputChange('code', e.target.value.toUpperCase())
								}
								required
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='code3'>
								ISO Code (3-letter) <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='code3'
								placeholder='TKM'
								maxLength={3}
								value={formData.code3}
								onChange={(e) =>
									handleInputChange('code3', e.target.value.toUpperCase())
								}
								required
							/>
						</div>
					</div>

					{/* Currency & Language */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='currency_code'>
								Currency Code <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='currency_code'
								placeholder='TMT'
								value={formData.currency_code}
								onChange={(e) =>
									handleInputChange('currency_code', e.target.value.toUpperCase())
								}
								required
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='default_language'>Default Language</Label>
							<Input
								id='default_language'
								placeholder='tk'
								value={formData.default_language}
								onChange={(e) =>
									handleInputChange('default_language', e.target.value)
								}
							/>
						</div>
					</div>

					{/* Phone Prefix & Timezone */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='phone_prefix'>
								Phone Prefix <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='phone_prefix'
								placeholder='+993'
								value={formData.phone_prefix}
								onChange={(e) =>
									handleInputChange('phone_prefix', e.target.value)
								}
								required
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='timezone'>
								Timezone <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='timezone'
								placeholder='Asia/Ashgabat'
								value={formData.timezone}
								onChange={(e) => handleInputChange('timezone', e.target.value)}
								required
							/>
						</div>
					</div>

					{/* Payment Methods */}
					<div className='space-y-2'>
						<Label>Payment Methods</Label>
						<div className='flex gap-2'>
							{['cash', 'card', 'wallet', 'stripe'].map((method) => (
								<Button
									key={method}
									type='button'
									variant={
										paymentMethods.includes(method) ? 'default' : 'outline'
									}
									size='sm'
									onClick={() => togglePaymentMethod(method)}
								>
									{method.charAt(0).toUpperCase() + method.slice(1)}
								</Button>
							))}
						</div>
						<p className='text-xs text-muted-foreground'>
							Select accepted payment methods
						</p>
					</div>

					{/* Active Status */}
					<div className='flex items-center space-x-2'>
						<Switch
							id='is_active'
							checked={formData.is_active}
							onCheckedChange={(checked) =>
								handleInputChange('is_active', checked)
							}
						/>
						<Label htmlFor='is_active' className='cursor-pointer'>
							Active (country is available on the platform)
						</Label>
					</div>

					<DialogFooter>
						<Button
							type='button'
							variant='outline'
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type='submit' disabled={isSubmitting}>
							{initialData
								? isSubmitting
									? 'Saving...'
									: 'Save Changes'
								: isSubmitting
									? 'Creating...'
									: 'Create Country'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
