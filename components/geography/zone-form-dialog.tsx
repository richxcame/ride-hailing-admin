'use client';

import { useEffect, useMemo } from 'react';
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

const ZONE_TYPE_OPTIONS: { value: ZoneType; label: string }[] = [
	{ value: 'airport', label: 'Airport' },
	{ value: 'downtown', label: 'Downtown' },
	{ value: 'transit_hub', label: 'Transit Hub' },
	{ value: 'event_venue', label: 'Event Venue' },
	{ value: 'border_crossing', label: 'Border Crossing' },
	{ value: 'toll_zone', label: 'Toll Zone' },
];

const inRange = (s: string, min: number, max: number) => {
	if (!s) return true;
	const n = Number(s);
	return !Number.isNaN(n) && n >= min && n <= max;
};

// Boundary + center coordinates are required when creating, optional when
// editing (so an admin can tweak a zone without re-entering its WKT polygon).
function makeZoneSchema(isEdit: boolean) {
	return z
		.object({
			name: z.string().trim().min(1, 'Name is required'),
			zone_type: z.enum([
				'airport',
				'downtown',
				'transit_hub',
				'event_venue',
				'border_crossing',
				'toll_zone',
			]),
			boundary: z.string(),
			center_latitude: z.string(),
			center_longitude: z.string(),
			priority: z.string(),
			is_active: z.boolean(),
		})
		.refine((d) => isEdit || d.boundary.trim().length > 0, {
			message: 'Boundary is required',
			path: ['boundary'],
		})
		.refine((d) => isEdit || d.center_latitude.trim().length > 0, {
			message: 'Latitude is required',
			path: ['center_latitude'],
		})
		.refine((d) => isEdit || d.center_longitude.trim().length > 0, {
			message: 'Longitude is required',
			path: ['center_longitude'],
		})
		.refine((d) => inRange(d.center_latitude, -90, 90), {
			message: 'Latitude must be between -90 and 90',
			path: ['center_latitude'],
		})
		.refine((d) => inRange(d.center_longitude, -180, 180), {
			message: 'Longitude must be between -180 and 180',
			path: ['center_longitude'],
		});
}

type ZoneFormValues = z.infer<ReturnType<typeof makeZoneSchema>>;

function toValues(z?: PricingZone | null): ZoneFormValues {
	return {
		name: z?.name ?? '',
		zone_type: (z?.zone_type ?? 'downtown') as ZoneType,
		boundary: z?.boundary ?? '',
		center_latitude: z?.center_latitude?.toString() ?? '',
		center_longitude: z?.center_longitude?.toString() ?? '',
		priority: z?.priority?.toString() ?? '0',
		is_active: z?.is_active ?? true,
	};
}

interface ZoneFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData?: PricingZone | null;
	onSubmit: (data: CreatePricingZoneRequest | UpdatePricingZoneRequest) => Promise<void>;
}

export function ZoneFormDialog({
	open,
	onOpenChange,
	initialData,
	onSubmit,
}: ZoneFormDialogProps) {
	const isEdit = !!initialData;
	const schema = useMemo(() => makeZoneSchema(isEdit), [isEdit]);

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<ZoneFormValues>({
		resolver: zodResolver(schema),
		defaultValues: toValues(initialData),
	});

	useEffect(() => {
		if (open) reset(toValues(initialData));
	}, [open, initialData, reset]);

	const submit = async (v: ZoneFormValues) => {
		try {
			const lat = v.center_latitude ? Number(v.center_latitude) : undefined;
			const lng = v.center_longitude ? Number(v.center_longitude) : undefined;
			const priority = v.priority ? parseInt(v.priority, 10) : undefined;

			if (initialData) {
				const payload: UpdatePricingZoneRequest = {
					name: v.name.trim(),
					zone_type: v.zone_type,
					boundary: v.boundary || undefined,
					center_latitude: lat,
					center_longitude: lng,
					priority,
					is_active: v.is_active,
				};
				await onSubmit(payload);
			} else {
				const payload: CreatePricingZoneRequest = {
					name: v.name.trim(),
					zone_type: v.zone_type,
					boundary: v.boundary,
					center_latitude: lat!,
					center_longitude: lng!,
					priority,
					is_active: v.is_active,
				};
				await onSubmit(payload);
			}

			toast.success(initialData ? 'Zone updated successfully' : 'Zone created successfully', {
				description: v.name.trim(),
			});
			onOpenChange(false);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: initialData
						? 'Failed to update zone'
						: 'Failed to create zone';
			toast.error(initialData ? 'Failed to update zone' : 'Failed to create zone', {
				description: errorMessage,
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size='lg'>
				<DialogHeader>
					<DialogTitle>{initialData ? 'Edit Zone' : 'Add Zone'}</DialogTitle>
					<DialogDescription>
						{initialData ? 'Update zone details' : 'Add a new pricing zone to the platform'}
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
							placeholder='Airport Zone'
							aria-invalid={!!errors.name}
							{...register('name')}
						/>
						{errors.name && <p className='text-xs text-destructive'>{errors.name.message}</p>}
					</div>

					{/* Zone Type */}
					<div className='space-y-2'>
						<Label htmlFor='zone_type'>
							Zone Type <span className='text-destructive'>*</span>
						</Label>
						<Controller
							control={control}
							name='zone_type'
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
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
							)}
						/>
					</div>

					{/* Boundary (WKT) */}
					<div className='space-y-2'>
						<Label htmlFor='boundary'>
							Boundary (WKT) {!initialData && <span className='text-destructive'>*</span>}
						</Label>
						<Textarea
							id='boundary'
							placeholder='POLYGON((...))  or GeoJSON string'
							rows={3}
							aria-invalid={!!errors.boundary}
							{...register('boundary')}
						/>
						{errors.boundary && (
							<p className='text-xs text-destructive'>{errors.boundary.message}</p>
						)}
					</div>

					{/* Center Coordinates */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='center_lat'>
								Center Latitude {!initialData && <span className='text-destructive'>*</span>}
							</Label>
							<Input
								id='center_lat'
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
							<Label htmlFor='center_lng'>
								Center Longitude {!initialData && <span className='text-destructive'>*</span>}
							</Label>
							<Input
								id='center_lng'
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

					{/* Priority */}
					<div className='space-y-2'>
						<Label htmlFor='priority'>Priority</Label>
						<Input id='priority' type='number' min='0' placeholder='0' {...register('priority')} />
						<p className='text-xs text-muted-foreground'>
							Higher priority zones take precedence when overlapping
						</p>
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
							Active (zone is available on the platform)
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
									: 'Create Zone'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
