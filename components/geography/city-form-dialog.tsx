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
	City,
	CreateCityRequest,
	UpdateCityRequest,
} from '@/lib/types/geography';

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
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		name: initialData?.name || '',
		center_latitude: initialData?.center_latitude?.toString() || '',
		center_longitude: initialData?.center_longitude?.toString() || '',
		is_active: initialData?.is_active ?? true,
	});

	// Reset form state to initialData when the dialog opens. See
	// https://react.dev/learn/you-might-not-need-an-effect — the canonical
	// fix would key an inner form component; we keep the dialog flat here.
	/* eslint-disable react-hooks/set-state-in-effect */
	useEffect(() => {
		if (open) {
			setFormData({
				name: initialData?.name || '',
				center_latitude: initialData?.center_latitude?.toString() || '',
				center_longitude: initialData?.center_longitude?.toString() || '',
				is_active: initialData?.is_active ?? true,
			});
		}
	}, [open, initialData]);
	/* eslint-enable react-hooks/set-state-in-effect */

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			if (!formData.name || !formData.center_latitude || !formData.center_longitude) {
				toast.error('Please fill in all required fields');
				return;
			}

			const center_latitude = parseFloat(formData.center_latitude);
			const center_longitude = parseFloat(formData.center_longitude);

			if (isNaN(center_latitude) || isNaN(center_longitude)) {
				toast.error('Please enter valid latitude and longitude values');
				return;
			}

			if (center_latitude < -90 || center_latitude > 90) {
				toast.error('Latitude must be between -90 and 90');
				return;
			}

			if (center_longitude < -180 || center_longitude > 180) {
				toast.error('Longitude must be between -180 and 180');
				return;
			}

			const payload: CreateCityRequest = {
				name: formData.name.trim(),
				center_latitude,
				center_longitude,
				is_active: formData.is_active,
			};

			await onSubmit(payload);

			toast.success(
				initialData
					? 'City updated successfully'
					: 'City created successfully',
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
						? 'Failed to update city'
						: 'Failed to create city';
			toast.error(
				initialData ? 'Failed to update city' : 'Failed to create city',
				{ description: errorMessage }
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle>
						{initialData ? 'Edit City' : 'Add City'}
					</DialogTitle>
					<DialogDescription>
						{initialData
							? 'Update city details'
							: 'Add a new city to the platform'}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='space-y-4'>
					{/* Name */}
					<div className='space-y-2'>
						<Label htmlFor='name'>
							Name <span className='text-destructive'>*</span>
						</Label>
						<Input
							id='name'
							placeholder='Ashgabat'
							value={formData.name}
							onChange={(e) => handleInputChange('name', e.target.value)}
							required
						/>
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
								value={formData.center_latitude}
								onChange={(e) =>
									handleInputChange('center_latitude', e.target.value)
								}
								required
							/>
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
								value={formData.center_longitude}
								onChange={(e) =>
									handleInputChange('center_longitude', e.target.value)
								}
								required
							/>
						</div>
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
							Active (city is available on the platform)
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
									: 'Create City'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
