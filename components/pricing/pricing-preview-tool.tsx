'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { IconSearch } from '@tabler/icons-react';
import { pricingService } from '@/lib/api/pricing.service';
import { PricingPreviewResult } from '@/lib/types/pricing';
import { geographyService } from '@/lib/api/geography.service';
import { rideTypesService } from '@/lib/api/ride-types.service';
import { fetchAllPages } from '@/lib/api/paginate';
import { Country } from '@/lib/types/geography';
import { RideType } from '@/lib/types/ride-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { EntityCombobox } from '@/components/entity-combobox';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export function PricingPreviewTool() {
	const [latitude, setLatitude] = useState('');
	const [longitude, setLongitude] = useState('');
	const [rideTypeId, setRideTypeId] = useState<string | undefined>();
	const [countryCode, setCountryCode] = useState('');
	const [result, setResult] = useState<PricingPreviewResult | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [countries, setCountries] = useState<Country[]>([]);
	const [rideTypes, setRideTypes] = useState<RideType[]>([]);

	// Load the country + ride-type pickers. Picking a country passes its code to
	// the preview endpoint, which resolves the currency straight from the
	// countries table — correct even for markets without region/city boundaries
	// (where coordinate→country resolution can't pin down a currency).
	useEffect(() => {
		let active = true;
		fetchAllPages((offset, limit) => geographyService.getCountries({ offset, limit }))
			.then((all) => active && setCountries(all))
			.catch(() => {});
		fetchAllPages((offset, limit) => rideTypesService.getRideTypes({ offset, limit }))
			.then((all) => active && setRideTypes(all))
			.catch(() => {});
		return () => {
			active = false;
		};
	}, []);

	// The backend now returns the resolved currency directly, so amounts are no
	// longer shown in a hardcoded "$".
	const currency = result?.currency_code ?? '';

	const handlePreview = async () => {
		if (!latitude || !longitude) {
			toast.error('Please enter latitude and longitude');
			return;
		}

		const lat = parseFloat(latitude);
		const lng = parseFloat(longitude);

		if (isNaN(lat) || isNaN(lng)) {
			toast.error('Invalid coordinates', {
				description: 'Please enter valid numeric values for latitude and longitude',
			});
			return;
		}

		if (lat < -90 || lat > 90) {
			toast.error('Invalid latitude', {
				description: 'Latitude must be between -90 and 90',
			});
			return;
		}

		if (lng < -180 || lng > 180) {
			toast.error('Invalid longitude', {
				description: 'Longitude must be between -180 and 180',
			});
			return;
		}

		try {
			setIsLoading(true);
			const response = await pricingService.previewPricing({
				latitude: lat,
				longitude: lng,
				ride_type_id: rideTypeId,
				country_code: countryCode || undefined,
			});
			setResult(response);
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Failed to preview pricing';
			toast.error('Failed to preview pricing', { description: msg });
			setResult(null);
		} finally {
			setIsLoading(false);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handlePreview();
		}
	};

	const formatCurrency = (value: number) => {
		if (currency) {
			try {
				return new Intl.NumberFormat(undefined, {
					style: 'currency',
					currency,
				}).format(value);
			} catch {
				return `${currency} ${value.toFixed(2)}`;
			}
		}
		return `$${value.toFixed(2)}`;
	};

	return (
		<div className='space-y-4'>
			{/* Input Section */}
			<Card>
				<CardHeader>
					<CardTitle>Pricing Preview</CardTitle>
					<CardDescription>
						Enter coordinates to see the resolved pricing for a specific location.
						Set a country to resolve the currency in markets without region/city
						boundary data.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='flex flex-wrap items-end gap-3'>
						<div className='space-y-1.5'>
							<Label htmlFor='preview-lat'>Latitude</Label>
							<Input
								id='preview-lat'
								type='number'
								step='any'
								placeholder='e.g., 37.9601'
								value={latitude}
								onChange={(e) => setLatitude(e.target.value)}
								onKeyDown={handleKeyDown}
								className='w-[180px]'
							/>
						</div>
						<div className='space-y-1.5'>
							<Label htmlFor='preview-lng'>Longitude</Label>
							<Input
								id='preview-lng'
								type='number'
								step='any'
								placeholder='e.g., 58.3261'
								value={longitude}
								onChange={(e) => setLongitude(e.target.value)}
								onKeyDown={handleKeyDown}
								className='w-[180px]'
							/>
						</div>
						<div className='space-y-1.5'>
							<Label htmlFor='preview-country'>Country (optional)</Label>
							<EntityCombobox
								items={countries.map((c) => ({ id: c.code, label: `${c.name} (${c.code})` }))}
								value={countryCode}
								onChange={(code) => setCountryCode(code)}
								placeholder='From coordinates'
								emptyMessage='No countries found'
								className='w-[200px]'
							/>
						</div>
						<div className='space-y-1.5'>
							<Label htmlFor='preview-ride-type'>Ride Type (optional)</Label>
							<Select
								value={rideTypeId || 'all'}
								onValueChange={(v) => setRideTypeId(v === 'all' ? undefined : v)}
							>
								<SelectTrigger id='preview-ride-type' className='w-[180px]'>
									<SelectValue placeholder='Any' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>Any</SelectItem>
									{rideTypes.map((rt) => (
										<SelectItem key={rt.id} value={rt.id}>
											{rt.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button onClick={handlePreview} disabled={isLoading}>
							<IconSearch className='h-4 w-4 mr-2' />
							{isLoading ? 'Loading...' : 'Preview'}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Loading State */}
			{isLoading && (
				<Card>
					<CardContent className='py-6'>
						<div className='space-y-3'>
							<Skeleton className='h-8 w-64' />
							<Skeleton className='h-4 w-full' />
							<Skeleton className='h-4 w-full' />
							<Skeleton className='h-4 w-3/4' />
							<Skeleton className='h-4 w-full' />
							<Skeleton className='h-4 w-2/3' />
						</div>
					</CardContent>
				</Card>
			)}

			{/* Results */}
			{!isLoading && result && (
				<Card>
					<CardHeader className='pb-3'>
						<CardTitle className='text-base'>Resolved Pricing</CardTitle>
						<CardDescription>
							Final computed values for this location
							{result.currency_code ? ` — prices shown in ${result.currency_code}` : ''}
							{result.country_code ? ` (${result.country_code})` : ''}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-1'>
							<h4 className='text-sm font-medium mb-2'>Fare Configuration</h4>
							<div className='flex items-center justify-between py-1.5'>
								<span className='text-sm text-muted-foreground'>Base Fare</span>
								<span className='text-sm font-medium'>{formatCurrency(result.base_fare)}</span>
							</div>
							<div className='flex items-center justify-between py-1.5'>
								<span className='text-sm text-muted-foreground'>Per KM Rate</span>
								<span className='text-sm font-medium'>{formatCurrency(result.per_km_rate)}</span>
							</div>
							<div className='flex items-center justify-between py-1.5'>
								<span className='text-sm text-muted-foreground'>Per Minute Rate</span>
								<span className='text-sm font-medium'>{formatCurrency(result.per_minute_rate)}</span>
							</div>
							<div className='flex items-center justify-between py-1.5'>
								<span className='text-sm text-muted-foreground'>Minimum Fare</span>
								<span className='text-sm font-medium'>{formatCurrency(result.minimum_fare)}</span>
							</div>
							<div className='flex items-center justify-between py-1.5'>
								<span className='text-sm text-muted-foreground'>Booking Fee</span>
								<span className='text-sm font-medium'>{formatCurrency(result.booking_fee)}</span>
							</div>
						</div>

						<Separator className='my-3' />

						<div className='space-y-1'>
							<h4 className='text-sm font-medium mb-2'>Commission & Incentives</h4>
							<div className='flex items-center justify-between py-1.5'>
								<span className='text-sm text-muted-foreground'>Platform Commission</span>
								<span className='text-sm font-medium'>{result.platform_commission_pct}%</span>
							</div>
							<div className='flex items-center justify-between py-1.5'>
								<span className='text-sm text-muted-foreground'>Driver Incentive</span>
								<span className='text-sm font-medium'>{result.driver_incentive_pct}%</span>
							</div>
						</div>

						<Separator className='my-3' />

						<div className='space-y-1'>
							<h4 className='text-sm font-medium mb-2'>Surge & Tax</h4>
							<div className='flex items-center justify-between py-1.5'>
								<span className='text-sm text-muted-foreground'>Surge Min Multiplier</span>
								<span className='text-sm font-medium'>{result.surge_min_multiplier}x</span>
							</div>
							<div className='flex items-center justify-between py-1.5'>
								<span className='text-sm text-muted-foreground'>Surge Max Multiplier</span>
								<span className='text-sm font-medium'>{result.surge_max_multiplier}x</span>
							</div>
							<div className='flex items-center justify-between py-1.5'>
								<span className='text-sm text-muted-foreground'>Tax Rate</span>
								<span className='text-sm font-medium'>{result.tax_rate_pct}%</span>
							</div>
							<div className='flex items-center justify-between py-1.5'>
								<span className='text-sm text-muted-foreground'>Tax Inclusive</span>
								<span className='text-sm font-medium'>{result.tax_inclusive ? 'Yes' : 'No'}</span>
							</div>
						</div>

						<Separator className='my-3' />

						<div className='space-y-1'>
							<h4 className='text-sm font-medium mb-2'>Cancellation Fees</h4>
							{result.cancellation_fees && result.cancellation_fees.length > 0 ? (
								result.cancellation_fees.map((tier, idx) => (
									<div key={idx} className='flex items-center justify-between py-1.5'>
										<span className='text-sm text-muted-foreground'>
											After {tier.after_minutes} min
										</span>
										<span className='text-sm font-medium'>
											{tier.fee_type === 'percentage' ? `${tier.fee}%` : formatCurrency(tier.fee)}
											<span className='text-xs text-muted-foreground ml-1'>({tier.fee_type})</span>
										</span>
									</div>
								))
							) : (
								<p className='text-sm text-muted-foreground'>No cancellation fees configured</p>
							)}
						</div>

						{result.inheritance_chain && result.inheritance_chain.length > 0 && (
							<>
								<Separator className='my-3' />
								<div className='space-y-1'>
									<h4 className='text-sm font-medium mb-2'>Inheritance Chain</h4>
									<p className='text-sm text-muted-foreground'>
										{result.inheritance_chain.join(' → ')}
									</p>
								</div>
							</>
						)}
					</CardContent>
				</Card>
			)}

			{/* Empty State */}
			{!isLoading && !result && (
				<Card>
					<CardContent className='flex flex-col items-center justify-center py-12 text-center'>
						<IconSearch className='h-12 w-12 text-muted-foreground mb-4' />
						<h3 className='text-lg font-semibold'>No Preview Yet</h3>
						<p className='text-sm text-muted-foreground'>
							Enter coordinates above and click Preview to see the resolved pricing
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
