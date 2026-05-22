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
	Region,
	CreateRegionRequest,
	UpdateRegionRequest,
} from '@/lib/types/geography';

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
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		name: initialData?.name || '',
		code: initialData?.code || '',
		is_active: initialData?.is_active ?? true,
	});

	// Reset form state to initialData when the dialog opens. See
	// https://react.dev/learn/you-might-not-need-an-effect.
	/* eslint-disable react-hooks/set-state-in-effect */
	useEffect(() => {
		if (open) {
			setFormData({
				name: initialData?.name || '',
				code: initialData?.code || '',
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
			if (!formData.name || !formData.code) {
				toast.error('Please fill in all required fields');
				return;
			}

			const payload: CreateRegionRequest = {
				name: formData.name.trim(),
				code: formData.code.toUpperCase().trim(),
				is_active: formData.is_active,
			};

			await onSubmit(payload);

			toast.success(
				initialData
					? 'Region updated successfully'
					: 'Region created successfully',
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
						? 'Failed to update region'
						: 'Failed to create region';
			toast.error(
				initialData ? 'Failed to update region' : 'Failed to create region',
				{ description: errorMessage }
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size='lg'>
				<DialogHeader>
					<DialogTitle>
						{initialData ? 'Edit Region' : 'Add Region'}
					</DialogTitle>
					<DialogDescription>
						{initialData
							? 'Update region details'
							: 'Add a new region to the platform'}
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
							placeholder='Ahal'
							value={formData.name}
							onChange={(e) => handleInputChange('name', e.target.value)}
							required
						/>
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
							value={formData.code}
							onChange={(e) =>
								handleInputChange('code', e.target.value.toUpperCase())
							}
							required
						/>
						<p className='text-xs text-muted-foreground'>
							Short region code (max 5 characters)
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
							Active (region is available on the platform)
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
									: 'Create Region'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
