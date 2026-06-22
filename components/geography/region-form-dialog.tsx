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
	Region,
	CreateRegionRequest,
	UpdateRegionRequest,
} from '@/lib/types/geography';

const regionSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	code: z.string().trim().min(1, 'Code is required').max(5, 'Max 5 characters'),
	is_active: z.boolean(),
});

type RegionFormValues = z.infer<typeof regionSchema>;

function toValues(r?: Region | null): RegionFormValues {
	return {
		name: r?.name ?? '',
		code: r?.code ?? '',
		is_active: r?.is_active ?? true,
	};
}

interface RegionFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initialData?: Region | null;
	onSubmit: (data: CreateRegionRequest | UpdateRegionRequest) => Promise<void>;
}

export function RegionFormDialog({
	open,
	onOpenChange,
	initialData,
	onSubmit,
}: RegionFormDialogProps) {
	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<RegionFormValues>({
		resolver: zodResolver(regionSchema),
		defaultValues: toValues(initialData),
	});

	useEffect(() => {
		if (open) reset(toValues(initialData));
	}, [open, initialData, reset]);

	const submit = async (v: RegionFormValues) => {
		try {
			const payload: CreateRegionRequest = {
				name: v.name.trim(),
				code: v.code.toUpperCase().trim(),
				is_active: v.is_active,
			};
			await onSubmit(payload);
			toast.success(
				initialData ? 'Region updated successfully' : 'Region created successfully',
				{ description: payload.name }
			);
			onOpenChange(false);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: initialData
						? 'Failed to update region'
						: 'Failed to create region';
			toast.error(initialData ? 'Failed to update region' : 'Failed to create region', {
				description: errorMessage,
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size='lg'>
				<DialogHeader>
					<DialogTitle>{initialData ? 'Edit Region' : 'Add Region'}</DialogTitle>
					<DialogDescription>
						{initialData ? 'Update region details' : 'Add a new region to the platform'}
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
							placeholder='Ahal'
							aria-invalid={!!errors.name}
							{...register('name')}
						/>
						{errors.name && <p className='text-xs text-destructive'>{errors.name.message}</p>}
					</div>

					{/* Code */}
					<div className='space-y-2'>
						<Label htmlFor='code'>
							Code <span className='text-destructive'>*</span>
						</Label>
						<Input
							id='code'
							placeholder='AH'
							maxLength={5}
							className='uppercase'
							aria-invalid={!!errors.code}
							{...register('code')}
						/>
						{errors.code ? (
							<p className='text-xs text-destructive'>{errors.code.message}</p>
						) : (
							<p className='text-xs text-muted-foreground'>Short region code (max 5 characters)</p>
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
							Active (region is available on the platform)
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
									: 'Create Region'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
