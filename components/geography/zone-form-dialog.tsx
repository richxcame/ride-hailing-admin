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
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type {
	PricingZone,
	ZoneType,
	CreatePricingZoneRequest,
	UpdatePricingZoneRequest,
} from '@/lib/types/geography';

interface ZoneFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData?: PricingZone | null;
	onSubmit: (
		data: CreatePricingZoneRequest | UpdatePricingZoneRequest
	) => Promise<void>;
}

const ZONE_TYPE_OPTIONS: { value: ZoneType; label: string }[] = [
	{ value: 'airport', label: 'Airport' },
	{ value: 'downtown', label: 'Downtown' },
	{ value: 'transit_hub', label: 'Transit Hub' },
	{ value: 'event_venue', label: 'Event Venue' },
	{ value: 'border_crossing', label: 'Border Crossing' },
	{ value: 'toll_zone', label: 'Toll Zone' },
];

export function ZoneFormDialog({
	open,
	onOpenChange,
	initialData,
	onSubmit,
}: ZoneFormDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		name: initialData?.name || '',
		zone_type: (initialData?.zone_type || 'downtown') as ZoneType,
		boundary: initialData?.boundary || '',
		center_latitude: initialData?.center_latitude?.toString() || '',
		center_longitude: initialData?.center_longitude?.toString() || '',
		priority: initialData?.priority?.toString() || '0',
		is_active: initialData?.is_active ?? true,
	});

	useEffect(() => {
		if (open) {
			setFormData({
				name: initialData?.name || '',
				zone_type: (initialData?.zone_type || 'downtown') as ZoneType,
				boundary: initialData?.boundary || '',
				center_latitude: initialData?.center_latitude?.toString() || '',
				center_longitude: initialData?.center_longitude?.toString() || '',
				priority: initialData?.priority?.toString() || '0',
				is_active: initialData?.is_active ?? true,
			});
		}
	}, [open, initialData]);

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			if (!formData.name || !formData.zone_type) {
				toast.error('Please fill in all required fields');
				return;
			}

			if (!initialData) {
				// Creating: boundary, lat, lng are required
				if (!formData.boundary || !formData.center_latitude || !formData.center_longitude) {
					toast.error('Boundary and center coordinates are required');
					return;
				}
			}

			const center_latitude = formData.center_latitude ? parseFloat(formData.center_latitude) : undefined;
			const center_longitude = formData.center_longitude ? parseFloat(formData.center_longitude) : undefined;

			if (center_latitude !== undefined && (isNaN(center_latitude) || center_latitude < -90 || center_latitude > 90)) {
				toast.error('Latitude must be between -90 and 90');
				return;
			}
			if (center_longitude !== undefined && (isNaN(center_longitude) || center_longitude < -180 || center_longitude > 180)) {
				toast.error('Longitude must be between -180 and 180');
				return;
			}

			if (initialData) {
				const payload: UpdatePricingZoneRequest = {
					name: formData.name.trim(),
					zone_type: formData.zone_type,
					boundary: formData.boundary || undefined,
					center_latitude,
					center_longitude,
					priority: formData.priority ? parseInt(formData.priority, 10) : undefined,
					is_active: formData.is_active,
				};
				await onSubmit(payload);
			} else {
				const payload: CreatePricingZoneRequest = {
					name: formData.name.trim(),
					zone_type: formData.zone_type,
					boundary: formData.boundary,
					center_latitude: center_latitude!,
					center_longitude: center_longitude!,
					priority: formData.priority ? parseInt(formData.priority, 10) : undefined,
					is_active: formData.is_active,
				};
				await onSubmit(payload);
			}

			toast.success(
				initialData
					? 'Zone updated successfully'
					: 'Zone created successfully',
				{
					description: formData.name.trim(),
				}
			);

			onOpenChange(false);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: initialData
						? 'Failed to update zone'
						: 'Failed to create zone';
			toast.error(
				initialData ? 'Failed to update zone' : 'Failed to create zone',
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
						{initialData ? 'Edit Zone' : 'Add Zone'}
					</DialogTitle>
					<DialogDescription>
						{initialData
							? 'Update zone details'
							: 'Add a new pricing zone to the platform'}
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
							placeholder='Airport Zone'
							value={formData.name}
							onChange={(e) => handleInputChange('name', e.target.value)}
							required
						/>
					</div>

					{/* Zone Type */}
					<div className='space-y-2'>
						<Label htmlFor='zone_type'>
							Zone Type <span className='text-destructive'>*</span>
						</Label>
						<Select
							value={formData.zone_type}
							onValueChange={(value) =>
								handleInputChange('zone_type', value as ZoneType)
							}
						>
							<SelectTrigger id='zone_type'>
								<SelectValue placeholder='Select zone type' />
							</SelectTrigger>
							<SelectContent>
								{ZONE_TYPE_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Boundary (WKT) */}
					<div className='space-y-2'>
						<Label htmlFor='boundary'>
							Boundary (WKT){' '}
							{!initialData && <span className='text-destructive'>*</span>}
						</Label>
						<Textarea
							id='boundary'
							placeholder='POLYGON((...))  or GeoJSON string'
							value={formData.boundary}
							onChange={(e) => handleInputChange('boundary', e.target.value)}
							rows={3}
							required={!initialData}
						/>
					</div>

					{/* Center Coordinates */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='center_lat'>
								Center Latitude{' '}
								{!initialData && <span className='text-destructive'>*</span>}
							</Label>
							<Input
								id='center_lat'
								type='number'
								step='0.000001'
								placeholder='37.960077'
								value={formData.center_latitude}
								onChange={(e) =>
									handleInputChange('center_latitude', e.target.value)
								}
								required={!initialData}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='center_lng'>
								Center Longitude{' '}
								{!initialData && <span className='text-destructive'>*</span>}
							</Label>
							<Input
								id='center_lng'
								type='number'
								step='0.000001'
								placeholder='58.326063'
								value={formData.center_longitude}
								onChange={(e) =>
									handleInputChange('center_longitude', e.target.value)
								}
								required={!initialData}
							/>
						</div>
					</div>

					{/* Priority */}
					<div className='space-y-2'>
						<Label htmlFor='priority'>Priority</Label>
						<Input
							id='priority'
							type='number'
							min='0'
							placeholder='0'
							value={formData.priority}
							onChange={(e) => handleInputChange('priority', e.target.value)}
						/>
						<p className='text-xs text-muted-foreground'>
							Higher priority zones take precedence when overlapping
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
							Active (zone is available on the platform)
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
									: 'Create Zone'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
