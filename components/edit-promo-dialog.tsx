'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { IconEdit } from '@tabler/icons-react';
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
import { promoService } from '@/lib/api/promo.service';
import { PromoCode } from '@/lib/types/models';
import { PromoFormFields } from '@/components/promo-form-fields';
import {
	promoSchema,
	promoToFormValues,
	promoFormToPayload,
	type PromoFormValues,
} from '@/lib/validators/promo';

interface EditPromoDialogProps {
	promo: PromoCode;
	onSuccess?: () => void;
	trigger?: React.ReactNode;
}

export function EditPromoDialog({ promo, onSuccess, trigger }: EditPromoDialogProps) {
	const [open, setOpen] = useState(false);
	const {
		register,
		handleSubmit,
		control,
		reset,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<PromoFormValues>({
		resolver: zodResolver(promoSchema),
		defaultValues: promoToFormValues(promo),
	});

	const onSubmit = async (v: PromoFormValues) => {
		try {
			const payload = promoFormToPayload(v);
			await promoService.updatePromoCode(promo.id, payload);
			toast.success('Promo code updated successfully', { description: `Code: ${payload.code}` });
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to update promo code';
			toast.error('Failed to update promo code', { description: errorMessage });
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				// Reset to the latest promo when (re)opening — an event handler, so
				// no set-state-in-effect needed.
				if (next) reset(promoToFormValues(promo));
			}}
		>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant='outline' size='sm'>
						<IconEdit className='h-4 w-4 mr-2' />
						Edit
					</Button>
				)}
			</DialogTrigger>
			<DialogContent size='lg'>
				<DialogHeader>
					<DialogTitle>Edit Promo Code</DialogTitle>
					<DialogDescription>Update the promotional discount code details</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
					<PromoFormFields
						register={register}
						control={control}
						errors={errors}
						discountType={watch('discount_type')}
					/>
					<DialogFooter>
						<Button type='button' variant='outline' onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button type='submit' disabled={isSubmitting}>
							{isSubmitting ? 'Updating...' : 'Update Promo Code'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
