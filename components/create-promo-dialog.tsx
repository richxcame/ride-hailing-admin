'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { IconPlus } from '@tabler/icons-react';
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
import { PromoFormFields } from '@/components/promo-form-fields';
import {
	promoSchema,
	PROMO_DEFAULTS,
	promoFormToPayload,
	type PromoFormValues,
} from '@/lib/validators/promo';

interface CreatePromoDialogProps {
	onSuccess?: () => void;
}

export function CreatePromoDialog({ onSuccess }: CreatePromoDialogProps) {
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
		defaultValues: PROMO_DEFAULTS,
	});

	const onSubmit = async (v: PromoFormValues) => {
		try {
			const payload = promoFormToPayload(v);
			await promoService.createPromoCode(payload);
			toast.success('Promo code created successfully', { description: `Code: ${payload.code}` });
			reset(PROMO_DEFAULTS);
			setOpen(false);
			onSuccess?.();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to create promo code';
			toast.error('Failed to create promo code', { description: errorMessage });
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) reset(PROMO_DEFAULTS);
			}}
		>
			<DialogTrigger asChild>
				<Button>
					<IconPlus className='h-4 w-4 mr-2' />
					Create Promo Code
				</Button>
			</DialogTrigger>
			<DialogContent size='lg'>
				<DialogHeader>
					<DialogTitle>Create Promo Code</DialogTitle>
					<DialogDescription>
						Create a new promotional discount code for users
					</DialogDescription>
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
							{isSubmitting ? 'Creating...' : 'Create Promo Code'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
