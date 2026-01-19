'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	IconTag,
	IconPlus,
	IconRefresh,
	IconCar,
	IconCurrencyDollar,
	IconClock,
	IconUsers,
} from '@tabler/icons-react';
import { promoService } from '@/lib/api/promo.service';
import { RideType, PromoCode } from '@/lib/types/models';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatePromoDialog } from '@/components/create-promo-dialog';
import { PromoDetailDialog } from '@/components/promo-detail-dialog';

export default function PromosPage() {
	const [rideTypes, setRideTypes] = useState<RideType[]>([]);
	const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
	const [referralCodes, setReferralCodes] = useState<
		Array<{
			id: string;
			user_id: string;
			code: string;
			total_referrals: number;
			total_earnings: number;
			created_at: string;
			updated_at: string;
		}>
	>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);

	const fetchData = async () => {
		try {
			setIsLoading(true);
			const [rideTypesData, promoCodesData, referralCodesData] = await Promise.all([
				promoService.getRideTypes(),
				promoService.getAllPromoCodes({ limit: 100, offset: 0 }),
				promoService.getAllReferralCodes({ limit: 100, offset: 0 }),
			]);
			setRideTypes(rideTypesData || []);
			setPromoCodes(promoCodesData?.data || []);
			setReferralCodes(referralCodesData?.data || []);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
			toast.error('Failed to load promos data', { description: errorMessage });
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(value);
	};

	const handlePromoClick = (promoId: string) => {
		setSelectedPromoId(promoId);
		setIsSheetOpen(true);
	};

	if (isLoading) {
		return (
			<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
				<Skeleton className='h-10 w-64' />
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{[...Array(3)].map((_, i) => (
						<Skeleton key={i} className='h-32' />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Promotions & Pricing</h1>
					<p className='text-sm text-muted-foreground'>
						Manage promo codes, referrals, and ride type pricing
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<Button variant='outline' size='sm' onClick={fetchData}>
						<IconRefresh className='h-4 w-4' />
					</Button>
				</div>
			</div>

			<Tabs defaultValue='ride-types' className='space-y-4'>
				<TabsList>
					<TabsTrigger value='ride-types'>Ride Types</TabsTrigger>
					<TabsTrigger value='promo-codes'>Promo Codes</TabsTrigger>
					<TabsTrigger value='referrals'>Referrals</TabsTrigger>
				</TabsList>

				{/* Ride Types Tab */}
				<TabsContent value='ride-types' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Ride Types & Pricing</CardTitle>
							<CardDescription>Configure pricing for different vehicle types</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
								{rideTypes.map((rideType) => (
									<Card key={rideType.id} className='relative'>
										<CardHeader>
											<div className='flex items-start justify-between'>
												<div>
													<CardTitle className='text-lg flex items-center gap-2'>
														<IconCar className='h-5 w-5' />
														{rideType.name}
													</CardTitle>
													<CardDescription className='mt-1'>{rideType.description}</CardDescription>
												</div>
												<Badge variant={rideType.is_active ? 'default' : 'secondary'}>
													{rideType.is_active ? 'Active' : 'Inactive'}
												</Badge>
											</div>
										</CardHeader>
										<CardContent className='space-y-3'>
											<div className='flex items-center justify-between text-sm'>
												<span className='text-muted-foreground'>Base Fare</span>
												<span className='font-medium'>{formatCurrency(rideType.base_fare)}</span>
											</div>
											<div className='flex items-center justify-between text-sm'>
												<span className='text-muted-foreground'>Per Kilometer</span>
												<span className='font-medium'>{formatCurrency(rideType.per_km_rate)}/km</span>
											</div>
											<div className='flex items-center justify-between text-sm'>
												<span className='text-muted-foreground'>Per Minute</span>
												<span className='font-medium'>{formatCurrency(rideType.per_minute_rate)}/min</span>
											</div>
											<div className='flex items-center justify-between text-sm'>
												<span className='text-muted-foreground'>Minimum Fare</span>
												<span className='font-medium'>{formatCurrency(rideType.minimum_fare)}</span>
											</div>
											<div className='flex items-center justify-between text-sm'>
												<span className='text-muted-foreground'>Capacity</span>
												<span className='font-medium flex items-center gap-1'>
													<IconUsers className='h-4 w-4' />
													{rideType.capacity} passengers
												</span>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Promo Codes Tab */}
				<TabsContent value='promo-codes' className='space-y-4'>
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<div>
									<CardTitle>Promo Codes</CardTitle>
									<CardDescription>Create and manage promotional discount codes</CardDescription>
								</div>
								<CreatePromoDialog onSuccess={fetchData} />
							</div>
						</CardHeader>
						<CardContent>
							{promoCodes.length === 0 ? (
								<div className='flex flex-col items-center justify-center py-12 text-center'>
									<IconTag className='h-12 w-12 text-muted-foreground mb-4' />
									<h3 className='text-lg font-semibold'>No Promo Codes Yet</h3>
									<p className='text-sm text-muted-foreground mb-4'>
										Create your first promotional discount code to get started
									</p>
									<CreatePromoDialog onSuccess={fetchData} />
								</div>
							) : (
								<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
									{promoCodes.map((promo) => (
										<Card
											key={promo.id}
											className='cursor-pointer hover:border-primary transition-colors'
											onClick={() => handlePromoClick(promo.id)}
										>
											<CardHeader>
												<div className='flex items-start justify-between'>
													<div>
														<CardTitle className='text-lg flex items-center gap-2'>
															<IconTag className='h-5 w-5' />
															{promo.code}
														</CardTitle>
														<CardDescription className='mt-1'>{promo.description}</CardDescription>
													</div>
													<Badge variant={promo.is_active ? 'default' : 'secondary'}>
														{promo.is_active ? 'Active' : 'Inactive'}
													</Badge>
												</div>
											</CardHeader>
											<CardContent className='space-y-3'>
												<div className='flex items-center justify-between text-sm'>
													<span className='text-muted-foreground'>Discount</span>
													<span className='font-medium'>
														{promo.discount_type === 'percentage'
															? `${promo.discount_value}%`
															: formatCurrency(promo.discount_value)}
													</span>
												</div>
												<div className='flex items-center justify-between text-sm'>
													<span className='text-muted-foreground'>Total Uses</span>
													<span className='font-medium'>
														{promo.total_uses}
														{promo.max_uses ? ` / ${promo.max_uses}` : ' / Unlimited'}
													</span>
												</div>
												<div className='flex items-center justify-between text-sm'>
													<span className='text-muted-foreground'>Valid Until</span>
													<span className='font-medium'>
														{new Date(promo.valid_until).toLocaleDateString()}
													</span>
												</div>
												{promo.min_ride_amount && (
													<div className='flex items-center justify-between text-sm'>
														<span className='text-muted-foreground'>Min. Ride</span>
														<span className='font-medium'>{formatCurrency(promo.min_ride_amount)}</span>
													</div>
												)}
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Referrals Tab */}
				<TabsContent value='referrals' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Referral Program</CardTitle>
							<CardDescription>Monitor referral performance and bonuses</CardDescription>
						</CardHeader>
						<CardContent>
							{referralCodes.length === 0 ? (
								<div className='flex flex-col items-center justify-center py-12 text-center'>
									<IconUsers className='h-12 w-12 text-muted-foreground mb-4' />
									<h3 className='text-lg font-semibold'>No Referrals Yet</h3>
									<p className='text-sm text-muted-foreground'>
										Referral codes will appear here once users start referring others
									</p>
								</div>
							) : (
								<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
									{referralCodes.map((referral) => (
										<Card key={referral.id}>
											<CardHeader>
												<div className='flex items-start justify-between'>
													<div>
														<CardTitle className='text-lg flex items-center gap-2'>
															<IconUsers className='h-5 w-5' />
															{referral.code}
														</CardTitle>
														<CardDescription className='mt-1 text-xs'>
															User ID: {referral.user_id.slice(0, 8)}...
														</CardDescription>
													</div>
													<Badge variant='outline'>{referral.total_referrals} referrals</Badge>
												</div>
											</CardHeader>
											<CardContent className='space-y-3'>
												<div className='flex items-center justify-between text-sm'>
													<span className='text-muted-foreground'>Total Referrals</span>
													<span className='font-medium flex items-center gap-1'>
														<IconUsers className='h-4 w-4' />
														{referral.total_referrals}
													</span>
												</div>
												<div className='flex items-center justify-between text-sm'>
													<span className='text-muted-foreground'>Total Earnings</span>
													<span className='font-medium flex items-center gap-1'>
														<IconCurrencyDollar className='h-4 w-4' />
														{formatCurrency(referral.total_earnings)}
													</span>
												</div>
												<div className='flex items-center justify-between text-sm'>
													<span className='text-muted-foreground'>Created</span>
													<span className='font-medium flex items-center gap-1'>
														<IconClock className='h-4 w-4' />
														{new Date(referral.created_at).toLocaleDateString()}
													</span>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Promo Detail Dialog */}
			<PromoDetailDialog
				promoId={selectedPromoId}
				open={isSheetOpen}
				onOpenChange={setIsSheetOpen}
				onUpdate={fetchData}
			/>
		</div>
	);
}
