'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const PAYMENT_METHODS = ['cash', 'card', 'wallet', 'stripe'] as const;

const countrySchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	native_name: z.string(),
	code: z.string().trim().length(2, 'Must be a 2-letter ISO code'),
	code3: z.string().trim().length(3, 'Must be a 3-letter ISO code'),
	currency_code: z.string().trim().min(1, 'Currency code is required'),
	default_language: z.string(),
	phone_prefix: z.string().trim().min(1, 'Phone prefix is required'),
	timezone: z.string().trim().min(1, 'Timezone is required'),
	is_active: z.boolean(),
	payment_methods: z.array(z.string()).min(1, 'Select at least one payment method'),
});

type CountryFormValues = z.infer<typeof countrySchema>;

function toValues(c?: Country | null): CountryFormValues {
	return {
		name: c?.name ?? '',
		native_name: c?.native_name ?? '',
		code: c?.code ?? '',
		code3: c?.code3 ?? '',
		currency_code: c?.currency_code ?? '',
		default_language: c?.default_language ?? '',
		phone_prefix: c?.phone_prefix ?? '',
		timezone: c?.timezone ?? '',
		is_active: c?.is_active ?? true,
		payment_methods: c?.payment_methods?.length ? c.payment_methods : ['cash'],
	};
}

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
	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<CountryFormValues>({
		resolver: zodResolver(countrySchema),
		defaultValues: toValues(initialData),
	});

	// Reset to the latest record whenever the dialog (re)opens. reset() is an RHF
	// method (not a useState setter), so this is free of the set-state-in-effect
	// warning the old hand-rolled form had to suppress.
	useEffect(() => {
		if (open) reset(toValues(initialData));
	}, [open, initialData, reset]);

	const submit = async (v: CountryFormValues) => {
		try {
			const payload: CreateCountryRequest = {
				name: v.name.trim(),
				native_name: v.native_name.trim(),
				code: v.code.toUpperCase().trim(),
				code3: v.code3.toUpperCase().trim(),
				currency_code: v.currency_code.toUpperCase().trim(),
				default_language: v.default_language.trim(),
				phone_prefix: v.phone_prefix.trim(),
				timezone: v.timezone.trim(),
				is_active: v.is_active,
				payment_methods: v.payment_methods,
			};

			await onSubmit(payload);
			toast.success(
				initialData ? 'Country updated successfully' : 'Country created successfully',
				{ description: payload.name }
			);
			onOpenChange(false);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: initialData
						? 'Failed to update country'
						: 'Failed to create country';
			toast.error(initialData ? 'Failed to update country' : 'Failed to create country', {
				description: errorMessage,
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size='lg'>
				<DialogHeader>
					<DialogTitle>{initialData ? 'Edit Country' : 'Add Country'}</DialogTitle>
					<DialogDescription>
						{initialData ? 'Update country details' : 'Add a new country to the platform'}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(submit)} className='space-y-4'>
					{/* Name & Native Name */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='name'>
								Name <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='name'
								placeholder='Turkmenistan'
								aria-invalid={!!errors.name}
								{...register('name')}
							/>
							{errors.name && <p className='text-xs text-destructive'>{errors.name.message}</p>}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='native_name'>Native Name</Label>
							<Input id='native_name' placeholder='Türkmenistan' {...register('native_name')} />
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
								className='uppercase'
								aria-invalid={!!errors.code}
								{...register('code')}
							/>
							{errors.code && <p className='text-xs text-destructive'>{errors.code.message}</p>}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='code3'>
								ISO Code (3-letter) <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='code3'
								placeholder='TKM'
								maxLength={3}
								className='uppercase'
								aria-invalid={!!errors.code3}
								{...register('code3')}
							/>
							{errors.code3 && <p className='text-xs text-destructive'>{errors.code3.message}</p>}
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
								className='uppercase'
								aria-invalid={!!errors.currency_code}
								{...register('currency_code')}
							/>
							{errors.currency_code && (
								<p className='text-xs text-destructive'>{errors.currency_code.message}</p>
							)}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='default_language'>Default Language</Label>
							<Input id='default_language' placeholder='tk' {...register('default_language')} />
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
								aria-invalid={!!errors.phone_prefix}
								{...register('phone_prefix')}
							/>
							{errors.phone_prefix && (
								<p className='text-xs text-destructive'>{errors.phone_prefix.message}</p>
							)}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='timezone'>
								Timezone <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='timezone'
								placeholder='Asia/Ashgabat'
								aria-invalid={!!errors.timezone}
								{...register('timezone')}
							/>
							{errors.timezone && (
								<p className='text-xs text-destructive'>{errors.timezone.message}</p>
							)}
						</div>
					</div>

					{/* Payment Methods */}
					<div className='space-y-2'>
						<Label>Payment Methods</Label>
						<Controller
							control={control}
							name='payment_methods'
							render={({ field }) => (
								<div className='flex gap-2'>
									{PAYMENT_METHODS.map((method) => {
										const selected = field.value.includes(method);
										return (
											<Button
												key={method}
												type='button'
												variant={selected ? 'default' : 'outline'}
												size='sm'
												onClick={() =>
													field.onChange(
														selected
															? field.value.filter((m) => m !== method)
															: [...field.value, method]
													)
												}
											>
												{method.charAt(0).toUpperCase() + method.slice(1)}
											</Button>
										);
									})}
								</div>
							)}
						/>
						{errors.payment_methods ? (
							<p className='text-xs text-destructive'>{errors.payment_methods.message}</p>
						) : (
							<p className='text-xs text-muted-foreground'>Select accepted payment methods</p>
						)}
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
							Active (country is available on the platform)
						</Label>
					</div>

					<DialogFooter>
						<Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
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
