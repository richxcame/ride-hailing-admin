'use client';

import { useCallback, useEffect, useState } from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { geographyService } from '@/lib/api/geography.service';
import { Country, Region, City, PricingZone } from '@/lib/types/geography';

interface LocationFilterProps {
	countryId?: string;
	regionId?: string;
	cityId?: string;
	zoneId?: string;
	onCountryChange: (id: string | undefined) => void;
	onRegionChange: (id: string | undefined) => void;
	onCityChange: (id: string | undefined) => void;
	onZoneChange?: (id: string | undefined) => void;
	showZone?: boolean;
	layout?: 'horizontal' | 'vertical';
}

export function LocationFilter({
	countryId,
	regionId,
	cityId,
	zoneId,
	onCountryChange,
	onRegionChange,
	onCityChange,
	onZoneChange,
	showZone = false,
	layout = 'horizontal',
}: LocationFilterProps) {
	const [countries, setCountries] = useState<Country[]>([]);
	const [regions, setRegions] = useState<Region[]>([]);
	const [cities, setCities] = useState<City[]>([]);
	const [zones, setZones] = useState<PricingZone[]>([]);

	const fetchCountries = useCallback(async () => {
		try {
			const response = await geographyService.getCountries({ limit: 100 });
			setCountries(response.data);
		} catch {
			setCountries([]);
		}
	}, []);

	const fetchRegions = useCallback(async (cId: string) => {
		try {
			const response = await geographyService.getRegions(cId, { limit: 100 });
			setRegions(response.data);
		} catch {
			setRegions([]);
		}
	}, []);

	const fetchCities = useCallback(async (rId: string) => {
		try {
			const response = await geographyService.getCities(rId, { limit: 100 });
			setCities(response.data);
		} catch {
			setCities([]);
		}
	}, []);

	const fetchZones = useCallback(async (cId: string) => {
		try {
			const response = await geographyService.getZones(cId, { limit: 100 });
			setZones(response.data);
		} catch {
			setZones([]);
		}
	}, []);

	useEffect(() => {
		fetchCountries();
	}, [fetchCountries]);

	useEffect(() => {
		if (countryId) {
			fetchRegions(countryId);
		} else {
			setRegions([]);
		}
	}, [countryId, fetchRegions]);

	useEffect(() => {
		if (regionId) {
			fetchCities(regionId);
		} else {
			setCities([]);
		}
	}, [regionId, fetchCities]);

	useEffect(() => {
		if (cityId && showZone) {
			fetchZones(cityId);
		} else {
			setZones([]);
		}
	}, [cityId, showZone, fetchZones]);

	const handleCountryChange = (value: string) => {
		const val = value === 'all' ? undefined : value;
		onCountryChange(val);
		onRegionChange(undefined);
		onCityChange(undefined);
		onZoneChange?.(undefined);
	};

	const handleRegionChange = (value: string) => {
		const val = value === 'all' ? undefined : value;
		onRegionChange(val);
		onCityChange(undefined);
		onZoneChange?.(undefined);
	};

	const handleCityChange = (value: string) => {
		const val = value === 'all' ? undefined : value;
		onCityChange(val);
		onZoneChange?.(undefined);
	};

	const handleZoneChange = (value: string) => {
		onZoneChange?.(value === 'all' ? undefined : value);
	};

	const containerClass =
		layout === 'horizontal'
			? 'flex flex-wrap items-end gap-3'
			: 'grid gap-3';

	return (
		<div className={containerClass}>
			<div className='space-y-1.5'>
				<Label className='text-xs text-muted-foreground'>Country</Label>
				<Select value={countryId || 'all'} onValueChange={handleCountryChange}>
					<SelectTrigger className='w-[160px]'>
						<SelectValue placeholder='All Countries' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>All Countries</SelectItem>
						{countries.map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.name} ({c.code})
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className='space-y-1.5'>
				<Label className='text-xs text-muted-foreground'>Region</Label>
				<Select
					value={regionId || 'all'}
					onValueChange={handleRegionChange}
					disabled={!countryId}
				>
					<SelectTrigger className='w-[160px]'>
						<SelectValue placeholder='All Regions' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>All Regions</SelectItem>
						{regions.map((r) => (
							<SelectItem key={r.id} value={r.id}>
								{r.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className='space-y-1.5'>
				<Label className='text-xs text-muted-foreground'>City</Label>
				<Select
					value={cityId || 'all'}
					onValueChange={handleCityChange}
					disabled={!regionId}
				>
					<SelectTrigger className='w-[160px]'>
						<SelectValue placeholder='All Cities' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>All Cities</SelectItem>
						{cities.map((c) => (
							<SelectItem key={c.id} value={c.id}>
								{c.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{showZone && (
				<div className='space-y-1.5'>
					<Label className='text-xs text-muted-foreground'>Zone</Label>
					<Select
						value={zoneId || 'all'}
						onValueChange={handleZoneChange}
						disabled={!cityId}
					>
						<SelectTrigger className='w-[160px]'>
							<SelectValue placeholder='All Zones' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All Zones</SelectItem>
							{zones.map((z) => (
								<SelectItem key={z.id} value={z.id}>
									{z.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}
		</div>
	);
}
