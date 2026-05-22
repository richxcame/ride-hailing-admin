'use client';

import { useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { EntityCombobox } from '@/components/entity-combobox';
import { geographyService } from '@/lib/api/geography.service';
import { fetchAllPages } from '@/lib/api/paginate';
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
	/**
	 * Fires once countries have loaded, so a parent can map a country id to its
	 * currency (e.g. to label fare inputs with the right currency).
	 */
	onCountriesLoaded?: (countries: Country[]) => void;
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
	onCountriesLoaded,
}: LocationFilterProps) {
	const [countries, setCountries] = useState<Country[]>([]);
	const [regions, setRegions] = useState<Region[]>([]);
	const [cities, setCities] = useState<City[]>([]);
	const [zones, setZones] = useState<PricingZone[]>([]);

	// Keep the latest callback without re-running the load effect.
	const onCountriesLoadedRef = useRef(onCountriesLoaded);
	useEffect(() => {
		onCountriesLoadedRef.current = onCountriesLoaded;
	}, [onCountriesLoaded]);

	// Load every country once on mount (paginate past the 100-per-page cap).
	useEffect(() => {
		let active = true;
		fetchAllPages((offset, limit) => geographyService.getCountries({ offset, limit }))
			.then((all) => {
				if (!active) return;
				setCountries(all);
				onCountriesLoadedRef.current?.(all);
			})
			.catch(() => active && setCountries([]));
		return () => {
			active = false;
		};
	}, []);

	// Load regions whenever the selected country changes.
	useEffect(() => {
		if (!countryId) return;
		let active = true;
		fetchAllPages((offset, limit) => geographyService.getRegions(countryId, { offset, limit }))
			.then((all) => active && setRegions(all))
			.catch(() => active && setRegions([]));
		return () => {
			active = false;
		};
	}, [countryId]);

	// Load cities whenever the selected region changes.
	useEffect(() => {
		if (!regionId) return;
		let active = true;
		fetchAllPages((offset, limit) => geographyService.getCities(regionId, { offset, limit }))
			.then((all) => active && setCities(all))
			.catch(() => active && setCities([]));
		return () => {
			active = false;
		};
	}, [regionId]);

	// Load zones whenever the selected city changes (only when zones are shown).
	useEffect(() => {
		if (!cityId || !showZone) return;
		let active = true;
		fetchAllPages((offset, limit) => geographyService.getZones(cityId, { offset, limit }))
			.then((all) => active && setZones(all))
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

	const handleCountryChange = (id: string) => {
		onCountryChange(id || undefined);
		onRegionChange(undefined);
		onCityChange(undefined);
		onZoneChange?.(undefined);
	};

	const handleRegionChange = (id: string) => {
		onRegionChange(id || undefined);
		onCityChange(undefined);
		onZoneChange?.(undefined);
	};

	const handleCityChange = (id: string) => {
		onCityChange(id || undefined);
		onZoneChange?.(undefined);
	};

	const containerClass =
		layout === 'horizontal' ? 'flex flex-wrap items-end gap-3' : 'grid gap-3';

	return (
		<div className={containerClass}>
			<div className='space-y-1.5'>
				<Label className='text-xs text-muted-foreground'>Country</Label>
				<EntityCombobox
					items={countries.map((c) => ({ id: c.id, label: `${c.name} (${c.code})` }))}
					value={countryId ?? ''}
					onChange={handleCountryChange}
					placeholder='All countries'
					emptyMessage='No countries found'
					className='w-52'
				/>
			</div>

			<div className='space-y-1.5'>
				<Label className='text-xs text-muted-foreground'>Region</Label>
				<EntityCombobox
					items={visibleRegions.map((r) => ({ id: r.id, label: r.name }))}
					value={regionId ?? ''}
					onChange={handleRegionChange}
					placeholder='All regions'
					emptyMessage='No regions found'
					disabled={!countryId}
					className='w-52'
				/>
			</div>

			<div className='space-y-1.5'>
				<Label className='text-xs text-muted-foreground'>City</Label>
				<EntityCombobox
					items={visibleCities.map((c) => ({ id: c.id, label: c.name }))}
					value={cityId ?? ''}
					onChange={handleCityChange}
					placeholder='All cities'
					emptyMessage='No cities found'
					disabled={!regionId}
					className='w-52'
				/>
			</div>

			{showZone && (
				<div className='space-y-1.5'>
					<Label className='text-xs text-muted-foreground'>Zone</Label>
					<EntityCombobox
						items={visibleZones.map((z) => ({ id: z.id, label: z.name }))}
						value={zoneId ?? ''}
						onChange={(id) => onZoneChange?.(id || undefined)}
						placeholder='All zones'
						emptyMessage='No zones found'
						disabled={!cityId}
						className='w-52'
					/>
				</div>
			)}
		</div>
	);
}
