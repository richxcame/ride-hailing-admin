'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RideType, CreateRideTypeRequest } from '@/lib/types/ride-types';
import { RideTypeIcon } from '@/components/ride-types/ride-type-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { DialogFooter } from '@/components/ui/dialog';

// Single source of truth for ride-type validation. Reused for create + edit, and
// the template for migrating other admin forms to react-hook-form + zod.
const rideTypeSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	description: z.string().trim().optional(),
	icon: z.string().trim().optional(),
	icon_url: z
		.string()
		.trim()
		.optional()
		.refine(
			(v) => !v || /^https?:\/\/.+/i.test(v),
			'Must be a URL starting with http:// or https://'
		),
	capacity: z
		.number({ message: 'Capacity is required' })
		.int('Must be a whole number')
		.min(1, 'Capacity must be at least 1'),
	sort_order: z
		.number({ message: 'Sort order is required' })
		.int('Must be a whole number')
		.min(0, 'Cannot be negative'),
	is_active: z.boolean(),
});

type RideTypeFormValues = z.infer<typeof rideTypeSchema>;

interface RideTypeFormProps {
	/** Existing ride type when editing; omit/null when creating. */
	initial?: RideType | null;
	isSubmitting: boolean;
	onSubmit: (payload: CreateRideTypeRequest) => void;
	onCancel: () => void;
}

export function RideTypeForm({ initial, isSubmitting, onSubmit, onCancel }: RideTypeFormProps) {
	const {
		register,
		handleSubmit,
		control,
		watch,
		formState: { errors },
	} = useForm<RideTypeFormValues>({
		resolver: zodResolver(rideTypeSchema),
		defaultValues: {
			name: initial?.name ?? '',
			description: initial?.description ?? '',
			icon: initial?.icon ?? '',
			icon_url: initial?.icon_url ?? '',
			capacity: initial?.capacity ?? 4,
			sort_order: initial?.sort_order ?? 0,
			is_active: initial?.is_active ?? true,
		},
	});

	// Live preview of whatever icon source the admin is entering.
	const watchedIconUrl = watch('icon_url');
	const watchedIcon = watch('icon');
	const watchedName = watch('name');

	const submit = (values: RideTypeFormValues) => {
		onSubmit({
			name: values.name.trim(),
			description: values.description?.trim() || undefined,
			icon: values.icon?.trim() || undefined,
			icon_url: values.icon_url?.trim() || undefined,
			capacity: values.capacity,
			sort_order: values.sort_order,
			is_active: values.is_active,
		});
	};

	return (
		<form onSubmit={handleSubmit(submit)}>
			<FieldGroup className='gap-4 py-4'>
				<Field>
					<FieldLabel htmlFor='rt-name'>
						Name <span className='text-destructive'>*</span>
					</FieldLabel>
					<Input
						id='rt-name'
						placeholder='e.g., Economy, Premium, XL'
						aria-invalid={!!errors.name}
						{...register('name')}
					/>
					{errors.name && (
						<FieldDescription className='text-destructive'>
							{errors.name.message}
						</FieldDescription>
					)}
				</Field>

				<Field>
					<FieldLabel htmlFor='rt-description'>Description</FieldLabel>
					<Textarea
						id='rt-description'
						placeholder='Affordable rides for everyday travel'
						rows={2}
						{...register('description')}
					/>
				</Field>

				<div className='grid grid-cols-3 gap-4'>
					<Field>
						<FieldLabel htmlFor='rt-icon'>Icon</FieldLabel>
						<Input id='rt-icon' placeholder='emoji, e.g. 🚗' {...register('icon')} />
					</Field>
					<Field>
						<FieldLabel htmlFor='rt-capacity'>
							Capacity <span className='text-destructive'>*</span>
						</FieldLabel>
						<Input
							id='rt-capacity'
							type='number'
							min={1}
							aria-invalid={!!errors.capacity}
							{...register('capacity', { valueAsNumber: true })}
						/>
						{errors.capacity && (
							<FieldDescription className='text-destructive'>
								{errors.capacity.message}
							</FieldDescription>
						)}
					</Field>
					<Field>
						<FieldLabel htmlFor='rt-sort'>Sort Order</FieldLabel>
						<Input
							id='rt-sort'
							type='number'
							min={0}
							aria-invalid={!!errors.sort_order}
							{...register('sort_order', { valueAsNumber: true })}
						/>
						{errors.sort_order && (
							<FieldDescription className='text-destructive'>
								{errors.sort_order.message}
							</FieldDescription>
						)}
					</Field>
				</div>

				<Field>
					<FieldLabel htmlFor='rt-icon-url'>Image / 3D model URL</FieldLabel>
					<div className='flex items-center gap-3'>
						<RideTypeIcon
							iconUrl={watchedIconUrl}
							icon={watchedIcon}
							name={watchedName}
							size='lg'
						/>
						<div className='flex-1'>
							<Input
								id='rt-icon-url'
								placeholder='https://cdn.example.com/ride-types/economy.glb'
								aria-invalid={!!errors.icon_url}
								{...register('icon_url')}
							/>
							{errors.icon_url ? (
								<FieldDescription className='text-destructive'>
									{errors.icon_url.message}
								</FieldDescription>
							) : (
								<FieldDescription>
									Public URL to a 2D image (PNG/WebP/SVG) or a 3D model (glTF/GLB/USDZ).
								</FieldDescription>
							)}
						</div>
					</div>
				</Field>

				<Field orientation='horizontal' className='justify-between'>
					<FieldLabel htmlFor='rt-active'>Active</FieldLabel>
					<Controller
						control={control}
						name='is_active'
						render={({ field }) => (
							<Switch
								id='rt-active'
								checked={field.value}
								onCheckedChange={field.onChange}
							/>
						)}
					/>
				</Field>
			</FieldGroup>

			<DialogFooter>
				<Button type='button' variant='outline' onClick={onCancel} disabled={isSubmitting}>
					Cancel
				</Button>
				<Button type='submit' disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : initial ? 'Update' : 'Create'}
				</Button>
			</DialogFooter>
		</form>
	);
}
