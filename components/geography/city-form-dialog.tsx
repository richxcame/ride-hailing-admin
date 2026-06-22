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
import type { City, CreateCityRequest, UpdateCityRequest } from '@/lib/types/geography';

// True when `s` is a finite number within [min, max]; empty passes so the
// "required" message (min(1)) is the one that shows for blank fields.
const inRange = (s: string, min: number, max: number) => {
	if (!s) return true;
	const n = Number(s);
	return !Number.isNaN(n) && n >= min && n <= max;
};

const citySchema = z
	.object({
		name: z.string().trim().min(1, 'Name is required'),
		center_latitude: z.string().min(1, 'Latitude is required'),
		center_longitude: z.string().min(1, 'Longitude is required'),
		is_active: z.boolean(),
	})
	.refine((d) => inRange(d.center_latitude, -90, 90), {
		message: 'Latitude must be between -90 and 90',
		path: ['center_latitude'],
	})
	.refine((d) => inRange(d.center_longitude, -180, 180), {
		message: 'Longitude must be between -180 and 180',
		path: ['center_longitude'],
	});

type CityFormValues = z.infer<typeof citySchema>;

function toValues(c?: City | null): CityFormValues {
	return {
		name: c?.name ?? '',
		center_latitude: c?.center_latitude?.toString() ?? '',
		center_longitude: c?.center_longitude?.toString() ?? '',
		is_active: c?.is_active ?? true,
	};
}

interface CityFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData?: City | null;
	onSubmit: (data: CreateCityRequest | UpdateCityRequest) => Promise<void>;
}

export function CityFormDialog({
	open,
	onOpenChange,
	initialData,
	onSubmit,
}: CityFormDialogProps) {
	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<CityFormValues>({
		resolver: zodResolver(citySchema),
		defaultValues: toValues(initialData),
	});

	useEffect(() => {
		if (open) reset(toValues(initialData));
	}, [open, initialData, reset]);

	const submit = async (v: CityFormValues) => {
		try {
			const payload: CreateCityRequest = {
				name: v.name.trim(),
				center_latitude: Number(v.center_latitude),
				center_longitude: Number(v.center_longitude),
				is_active: v.is_active,
			};
			await onSubmit(payload);
			toast.success(
				initialData ? 'City updated successfully' : 'City created successfully',
				{ description: payload.name }
			);
			onOpenChange(false);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: initialData
						? 'Failed to update city'
						: 'Failed to create city';
			toast.error(initialData ? 'Failed to update city' : 'Failed to create city', {
				description: errorMessage,
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size='lg'>
				<DialogHeader>
					<DialogTitle>{initialData ? 'Edit City' : 'Add City'}</DialogTitle>
					<DialogDescription>
						{initialData ? 'Update city details' : 'Add a new city to the platform'}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(submit)} className='space-y-4'>
					{/* Name */}
					<div className='space-y-2'>
						<Label htmlFor='name'>
							Name <span className='text-destructive'>*</span>
						</Label>
						<Input
							id='name'
							placeholder='Ashgabat'
							aria-invalid={!!errors.name}
							{...register('name')}
						/>
						{errors.name && <p className='text-xs text-destructive'>{errors.name.message}</p>}
					</div>

					{/* Latitude & Longitude */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='latitude'>
								Latitude <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='latitude'
								type='number'
								step='0.000001'
								placeholder='37.960077'
								aria-invalid={!!errors.center_latitude}
								{...register('center_latitude')}
							/>
							{errors.center_latitude && (
								<p className='text-xs text-destructive'>{errors.center_latitude.message}</p>
							)}
						</div>

						<div className='space-y-2'>
							<Label htmlFor='longitude'>
								Longitude <span className='text-destructive'>*</span>
							</Label>
							<Input
								id='longitude'
								type='number'
								step='0.000001'
								placeholder='58.326063'
								aria-invalid={!!errors.center_longitude}
								{...register('center_longitude')}
							/>
							{errors.center_longitude && (
								<p className='text-xs text-destructive'>{errors.center_longitude.message}</p>
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
							Active (city is available on the platform)
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
									: 'Create City'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
