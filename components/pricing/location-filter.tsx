'use client';

import { useEffect, useState } from 'react';
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

	// Load countries once on mount.
	useEffect(() => {
		let active = true;
		geographyService
			.getCountries({ limit: 100 })
			.then((res) => active && setCountries(res.data))
			.catch(() => active && setCountries([]));
		return () => {
			active = false;
		};
	}, []);

	// Load regions whenever the selected country changes.
	useEffect(() => {
		if (!countryId) return;
		let active = true;
		geographyService
			.getRegions(countryId, { limit: 100 })
			.then((res) => active && setRegions(res.data))
			.catch(() => active && setRegions([]));
		return () => {
			active = false;
		};
	}, [countryId]);

	// Load cities whenever the selected region changes.
	useEffect(() => {
		if (!regionId) return;
		let active = true;
		geographyService
			.getCities(regionId, { limit: 100 })
			.then((res) => active && setCities(res.data))
			.catch(() => active && setCities([]));
		return () => {
			active = false;
		};
	}, [regionId]);

	// Load zones whenever the selected city changes (only when zones are shown).
	useEffect(() => {
		if (!cityId || !showZone) return;
		let active = true;
		geographyService
			.getZones(cityId, { limit: 100 })
			.then((res) => active && setZones(res.data))
			.catch(() => active && setZones([]));
		return () => {
			active = false;
		};
	}, [cityId, showZone]);

	// Derive visible options during render so stale child options are never
	// shown for an unselected parent (avoids resetting state inside effects).
	const visibleRegions = countryId ? regions : [];
	const visibleCities = regionId ? cities : [];
	const visibleZones = cityId && showZone ? zones : [];

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
						{visibleRegions.map((r) => (
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
						{visibleCities.map((c) => (
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
							{visibleZones.map((z) => (
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
