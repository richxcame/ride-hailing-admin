'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
	IconTag,
	IconCurrencyDollar,
	IconUsers,
	IconTrendingUp,
	IconAlertCircle,
} from '@tabler/icons-react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { promoService } from '@/lib/api/promo.service';
import { PromoCode } from '@/lib/types/models';
import { EditPromoDialog } from './edit-promo-dialog';

interface PromoDetailDialogProps {
	promoId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUpdate?: () => void;
}

export function PromoDetailDialog({ promoId, open, onOpenChange, onUpdate }: PromoDetailDialogProps) {
	const [promo, setPromo] = useState<PromoCode | null>(null);
	const [stats, setStats] = useState<{
		promo_code: PromoCode;
		total_discount_given: number;
		unique_users: number;
		recent_uses: Array<{
			user_id: string;
			ride_id: string;
			discount_amount: number;
			used_at: string;
		}>;
	} | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isDeactivating, setIsDeactivating] = useState(false);

	const fetchPromoDetails = useCallback(async () => {
		if (!promoId) return;

		try {
			setIsLoading(true);
			const [promoData, statsData] = await Promise.all([
				promoService.getPromoCode(promoId),
				promoService.getPromoCodeUsageStats(promoId),
			]);
			setPromo(promoData);
			setStats(statsData);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load promo details';
			toast.error('Failed to load promo details', { description: errorMessage });
		} finally {
			setIsLoading(false);
		}
	}, [promoId]);

	useEffect(() => {
		if (open && promoId) {
			fetchPromoDetails();
		}
	}, [open, promoId, fetchPromoDetails]);

	const handleDeactivate = async () => {
		if (!promoId) return;

		try {
			setIsDeactivating(true);
			await promoService.deactivatePromoCode(promoId);
			toast.success('Promo code deactivated successfully');
			onUpdate?.();
			onOpenChange(false);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate promo code';
			toast.error('Failed to deactivate promo code', { description: errorMessage });
		} finally {
			setIsDeactivating(false);
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(value);
	};

	const handleUpdate = () => {
		fetchPromoDetails();
		onUpdate?.();
	};

	if (!promoId) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<IconTag className='h-5 w-5' />
						Promo Code Details
					</DialogTitle>
					<DialogDescription>View usage statistics and manage promo code</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className='space-y-4'>
						<Skeleton className='h-32' />
						<Skeleton className='h-32' />
						<Skeleton className='h-32' />
					</div>
				) : promo && stats ? (
					<div className='space-y-6'>
						{/* Promo Code Info */}
						<Card>
							<CardHeader>
								<div className='flex items-start justify-between'>
									<div>
										<CardTitle className='text-2xl'>{promo.code}</CardTitle>
										<CardDescription className='mt-1'>{promo.description}</CardDescription>
									</div>
									<Badge variant={promo.is_active ? 'default' : 'secondary'}>
										{promo.is_active ? 'Active' : 'Inactive'}
									</Badge>
								</div>
							</CardHeader>
							<CardContent className='grid gap-3 md:grid-cols-2'>
								<div className='flex items-center justify-between'>
									<span className='text-sm text-muted-foreground'>Discount</span>
									<span className='font-medium'>
										{promo.discount_type === 'percentage'
											? `${promo.discount_value}%`
											: formatCurrency(promo.discount_value)}
									</span>
								</div>
								<div className='flex items-center justify-between'>
									<span className='text-sm text-muted-foreground'>Uses</span>
									<span className='font-medium'>
										{promo.total_uses}
										{promo.max_uses ? ` / ${promo.max_uses}` : ' / Unlimited'}
									</span>
								</div>
								<div className='flex items-center justify-between'>
									<span className='text-sm text-muted-foreground'>Uses Per User</span>
									<span className='font-medium'>{promo.uses_per_user}</span>
								</div>
								{promo.min_ride_amount && (
									<div className='flex items-center justify-between'>
										<span className='text-sm text-muted-foreground'>Min. Ride Amount</span>
										<span className='font-medium'>{formatCurrency(promo.min_ride_amount)}</span>
									</div>
								)}
								{promo.max_discount_amount && (
									<div className='flex items-center justify-between'>
										<span className='text-sm text-muted-foreground'>Max. Discount</span>
										<span className='font-medium'>{formatCurrency(promo.max_discount_amount)}</span>
									</div>
								)}
								<div className='flex items-center justify-between'>
									<span className='text-sm text-muted-foreground'>Valid From</span>
									<span className='font-medium'>
										{new Date(promo.valid_from).toLocaleDateString()}
									</span>
								</div>
								<div className='flex items-center justify-between'>
									<span className='text-sm text-muted-foreground'>Valid Until</span>
									<span className='font-medium'>
										{new Date(promo.valid_until).toLocaleDateString()}
									</span>
								</div>
							</CardContent>
						</Card>

						{/* Usage Statistics */}
						<div className='grid gap-4 md:grid-cols-2'>
							<Card>
								<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
									<CardTitle className='text-sm font-medium'>Total Discount Given</CardTitle>
									<IconCurrencyDollar className='h-4 w-4 text-muted-foreground' />
								</CardHeader>
								<CardContent>
									<div className='text-2xl font-bold'>{formatCurrency(stats.total_discount_given)}</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
									<CardTitle className='text-sm font-medium'>Unique Users</CardTitle>
									<IconUsers className='h-4 w-4 text-muted-foreground' />
								</CardHeader>
								<CardContent>
									<div className='text-2xl font-bold'>{stats.unique_users}</div>
								</CardContent>
							</Card>
						</div>

						{/* Recent Uses */}
						{stats.recent_uses && stats.recent_uses.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className='text-sm font-medium flex items-center gap-2'>
										<IconTrendingUp className='h-4 w-4' />
										Recent Uses
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='space-y-3'>
										{stats.recent_uses.map((use, idx) => (
											<div
												key={idx}
												className='flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0'
											>
												<div className='space-y-1'>
													<div className='font-medium'>User: {use.user_id.slice(0, 8)}...</div>
													<div className='text-xs text-muted-foreground'>
														{new Date(use.used_at).toLocaleString()}
													</div>
												</div>
												<div className='text-right'>
													<div className='font-medium text-green-600'>
														-{formatCurrency(use.discount_amount)}
													</div>
													<div className='text-xs text-muted-foreground'>
														Ride: {use.ride_id.slice(0, 8)}...
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}

						{/* Actions */}
						<div className='flex gap-2 justify-end'>
							<EditPromoDialog promo={promo} onSuccess={handleUpdate} />
							{promo.is_active && (
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button variant='destructive' disabled={isDeactivating}>
											<IconAlertCircle className='h-4 w-4 mr-2' />
											Deactivate
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Deactivate Promo Code?</AlertDialogTitle>
											<AlertDialogDescription>
												This will prevent users from using this promo code. This action can be
												reversed by editing the promo code.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Cancel</AlertDialogCancel>
											<AlertDialogAction onClick={handleDeactivate}>
												Deactivate
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							)}
						</div>
					</div>
				) : (
					<div className='flex flex-col items-center justify-center py-12'>
						<IconAlertCircle className='h-12 w-12 text-muted-foreground mb-4' />
						<p className='text-sm text-muted-foreground'>Failed to load promo code details</p>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
