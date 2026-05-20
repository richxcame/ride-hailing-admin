'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	IconWorld,
	IconMap2,
	IconBuildings,
	IconMapPin,
	IconPlus,
	IconRefresh,
	IconChevronRight,
	IconSearch,
} from '@tabler/icons-react';
import { geographyService } from '@/lib/api/geography.service';
import {
	Country,
	Region,
	City,
	PricingZone,
	GeoStats,
	CreateCountryRequest,
	UpdateCountryRequest,
	CreateRegionRequest,
	UpdateRegionRequest,
	CreateCityRequest,
	UpdateCityRequest,
	CreatePricingZoneRequest,
	UpdatePricingZoneRequest,
} from '@/lib/types/geography';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CountriesTable } from '@/components/geography/countries-table';
import { RegionsTable } from '@/components/geography/regions-table';
import { CitiesTable } from '@/components/geography/cities-table';
import { ZonesTable } from '@/components/geography/zones-table';
import { CountryFormDialog } from '@/components/geography/country-form-dialog';
import { RegionFormDialog } from '@/components/geography/region-form-dialog';
import { CityFormDialog } from '@/components/geography/city-form-dialog';
import { ZoneFormDialog } from '@/components/geography/zone-form-dialog';

type GeoLevel = 'countries' | 'regions' | 'cities' | 'zones';

export default function GeographyPage() {
	// Navigation state
	const [currentLevel, setCurrentLevel] = useState<GeoLevel>('countries');
	const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
	const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
	const [selectedCity, setSelectedCity] = useState<City | null>(null);

	// Data
	const [countries, setCountries] = useState<Country[]>([]);
	const [regions, setRegions] = useState<Region[]>([]);
	const [cities, setCities] = useState<City[]>([]);
	const [zones, setZones] = useState<PricingZone[]>([]);

	// Loading & pagination
	const [isLoading, setIsLoading] = useState(true);
	const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });
	const [searchQuery, setSearchQuery] = useState('');

	// Dialogs
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<Country | Region | City | PricingZone | null>(
		null
	);
	const [editingLevel, setEditingLevel] = useState<GeoLevel>('countries');

	// Stats
	const [stats, setStats] = useState<GeoStats | null>(null);
	const [isLoadingStats, setIsLoadingStats] = useState(true);

	const fetchStats = useCallback(async () => {
		try {
			setIsLoadingStats(true);
			const data = await geographyService.getStats();
			setStats(data);
		} catch (error) {
			console.error('Failed to fetch geography stats:', error);
		} finally {
			setIsLoadingStats(false);
		}
	}, []);

	// Fetch data for current level
	const fetchCountries = useCallback(
		async (offset = 0) => {
			try {
				setIsLoading(true);
				const response = await geographyService.getCountries({
					limit: pagination.limit,
					offset,
					...(searchQuery && { search: searchQuery }),
				});
				setCountries(response.data);
				setPagination((prev) => ({ ...prev, total: response.meta.total, offset }));
			} catch (error) {
				const msg = error instanceof Error ? error.message : 'Failed to load countries';
				toast.error('Failed to load countries', { description: msg });
			} finally {
				setIsLoading(false);
			}
		},
		[pagination.limit, searchQuery]
	);

	const fetchRegions = useCallback(
		async (countryId: string, offset = 0) => {
			try {
				setIsLoading(true);
				const response = await geographyService.getRegions(countryId, {
					limit: pagination.limit,
					offset,
					...(searchQuery && { search: searchQuery }),
				});
				setRegions(response.data);
				setPagination((prev) => ({ ...prev, total: response.meta.total, offset }));
			} catch (error) {
				const msg = error instanceof Error ? error.message : 'Failed to load regions';
				toast.error('Failed to load regions', { description: msg });
			} finally {
				setIsLoading(false);
			}
		},
		[pagination.limit, searchQuery]
	);

	const fetchCities = useCallback(
		async (regionId: string, offset = 0) => {
			try {
				setIsLoading(true);
				const response = await geographyService.getCities(regionId, {
					limit: pagination.limit,
					offset,
					...(searchQuery && { search: searchQuery }),
				});
				setCities(response.data);
				setPagination((prev) => ({ ...prev, total: response.meta.total, offset }));
			} catch (error) {
				const msg = error instanceof Error ? error.message : 'Failed to load cities';
				toast.error('Failed to load cities', { description: msg });
			} finally {
				setIsLoading(false);
			}
		},
		[pagination.limit, searchQuery]
	);

	const fetchZones = useCallback(
		async (cityId: string, offset = 0) => {
			try {
				setIsLoading(true);
				const response = await geographyService.getZones(cityId, {
					limit: pagination.limit,
					offset,
					...(searchQuery && { search: searchQuery }),
				});
				setZones(response.data);
				setPagination((prev) => ({ ...prev, total: response.meta.total, offset }));
			} catch (error) {
				const msg = error instanceof Error ? error.message : 'Failed to load zones';
				toast.error('Failed to load zones', { description: msg });
			} finally {
				setIsLoading(false);
			}
		},
		[pagination.limit, searchQuery]
	);

	// Fetch current level data
	const fetchCurrentLevel = useCallback(() => {
		switch (currentLevel) {
			case 'countries':
				fetchCountries(pagination.offset);
				break;
			case 'regions':
				if (selectedCountry) fetchRegions(selectedCountry.id, pagination.offset);
				break;
			case 'cities':
				if (selectedRegion) fetchCities(selectedRegion.id, pagination.offset);
				break;
			case 'zones':
				if (selectedCity) fetchZones(selectedCity.id, pagination.offset);
				break;
		}
	}, [
		currentLevel,
		selectedCountry,
		selectedRegion,
		selectedCity,
		pagination.offset,
		fetchCountries,
		fetchRegions,
		fetchCities,
		fetchZones,
	]);

	// Initial load — run once on mount. We deliberately don't depend on the
	// memoized fetchers (which change when search/pagination change) because
	// the rest of the page already calls them explicitly from event handlers.
	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const response = await geographyService.getCountries({
					limit: pagination.limit,
					offset: 0,
				});
				if (active) {
					setCountries(response.data);
					setPagination((prev) => ({ ...prev, total: response.meta.total, offset: 0 }));
				}
			} catch (error) {
				const msg = error instanceof Error ? error.message : 'Failed to load countries';
				if (active) toast.error('Failed to load countries', { description: msg });
			} finally {
				if (active) setIsLoading(false);
			}
		})();
		(async () => {
			try {
				const data = await geographyService.getStats();
				if (active) setStats(data);
			} catch (error) {
				console.error('Failed to fetch geography stats:', error);
			} finally {
				if (active) setIsLoadingStats(false);
			}
		})();
		return () => {
			active = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Drill-down handlers
	const handleDrillDown = (item: Country | Region | City) => {
		setSearchQuery('');
		setPagination({ total: 0, limit: 20, offset: 0 });

		if (currentLevel === 'countries') {
			setSelectedCountry(item as Country);
			setCurrentLevel('regions');
			fetchRegions((item as Country).id);
		} else if (currentLevel === 'regions') {
			setSelectedRegion(item as Region);
			setCurrentLevel('cities');
			fetchCities((item as Region).id);
		} else if (currentLevel === 'cities') {
			setSelectedCity(item as City);
			setCurrentLevel('zones');
			fetchZones((item as City).id);
		}
	};

	// Breadcrumb navigation
	const handleNavigate = (level: GeoLevel) => {
		if (level === currentLevel) return;
		setSearchQuery('');
		setPagination({ total: 0, limit: 20, offset: 0 });
		setCurrentLevel(level);

		if (level === 'countries') {
			setSelectedCountry(null);
			setSelectedRegion(null);
			setSelectedCity(null);
			fetchCountries();
		} else if (level === 'regions' && selectedCountry) {
			setSelectedRegion(null);
			setSelectedCity(null);
			fetchRegions(selectedCountry.id);
		} else if (level === 'cities' && selectedRegion) {
			setSelectedCity(null);
			fetchCities(selectedRegion.id);
		}
	};

	// Page change
	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
		switch (currentLevel) {
			case 'countries':
				fetchCountries(newOffset);
				break;
			case 'regions':
				if (selectedCountry) fetchRegions(selectedCountry.id, newOffset);
				break;
			case 'cities':
				if (selectedRegion) fetchCities(selectedRegion.id, newOffset);
				break;
			case 'zones':
				if (selectedCity) fetchZones(selectedCity.id, newOffset);
				break;
		}
	};

	// Search
	const handleSearch = () => {
		setPagination((prev) => ({ ...prev, offset: 0 }));
		fetchCurrentLevel();
	};

	// Toggle active
	const handleToggleActive = async (id: string) => {
		try {
			let item: Country | Region | City | PricingZone | undefined;
			switch (currentLevel) {
				case 'countries':
					item = countries.find((c) => c.id === id);
					if (item) await geographyService.updateCountry(id, { is_active: !item.is_active });
					break;
				case 'regions':
					item = regions.find((r) => r.id === id);
					if (item) await geographyService.updateRegion(id, { is_active: !item.is_active });
					break;
				case 'cities':
					item = cities.find((c) => c.id === id);
					if (item) await geographyService.updateCity(id, { is_active: !item.is_active });
					break;
				case 'zones':
					item = zones.find((z) => z.id === id);
					if (item) await geographyService.updateZone(id, { is_active: !item.is_active });
					break;
			}
			if (item) {
				toast.success(`${item.name} ${item.is_active ? 'deactivated' : 'activated'}`);
				fetchCurrentLevel();
				fetchStats();
			}
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Failed to update status';
			toast.error('Failed to update status', { description: msg });
		}
	};

	// Edit handler — captures the level at the time of click
	const handleEdit = (id: string, level: GeoLevel) => {
		let item: Country | Region | City | PricingZone | undefined;
		switch (level) {
			case 'countries':
				item = countries.find((c) => c.id === id);
				break;
			case 'regions':
				item = regions.find((r) => r.id === id);
				break;
			case 'cities':
				item = cities.find((c) => c.id === id);
				break;
			case 'zones':
				item = zones.find((z) => z.id === id);
				break;
		}
		if (item) {
			setEditingItem(item);
			setEditingLevel(level);
			setEditDialogOpen(true);
		}
	};

	// Table action handlers
	const handleCountryAction = (action: string, id: string) => {
		if (action === 'view_regions') {
			const country = countries.find((c) => c.id === id);
			if (country) handleDrillDown(country);
		} else if (action === 'edit') {
			handleEdit(id, 'countries');
		} else if (action === 'toggle_active') {
			handleToggleActive(id);
		}
	};

	const handleRegionAction = (action: string, id: string) => {
		if (action === 'view_cities') {
			const region = regions.find((r) => r.id === id);
			if (region) handleDrillDown(region);
		} else if (action === 'edit') {
			handleEdit(id, 'regions');
		} else if (action === 'toggle_active') {
			handleToggleActive(id);
		}
	};

	const handleCityAction = (action: string, id: string) => {
		if (action === 'view_zones') {
			const city = cities.find((c) => c.id === id);
			if (city) handleDrillDown(city);
		} else if (action === 'edit') {
			handleEdit(id, 'cities');
		} else if (action === 'toggle_active') {
			handleToggleActive(id);
		}
	};

	const handleZoneAction = (action: string, id: string) => {
		if (action === 'edit') {
			handleEdit(id, 'zones');
		} else if (action === 'toggle_active') {
			handleToggleActive(id);
		}
	};

	// Create/Edit submit handlers
	const handleCreateCountry = async (data: CreateCountryRequest | UpdateCountryRequest) => {
		await geographyService.createCountry(data as CreateCountryRequest);
		toast.success('Country created');
		setCreateDialogOpen(false);
		fetchCountries();
		fetchStats();
	};

	const handleEditCountry = async (data: CreateCountryRequest | UpdateCountryRequest) => {
		if (!editingItem) return;
		await geographyService.updateCountry(editingItem.id, data as UpdateCountryRequest);
		toast.success('Country updated');
		setEditDialogOpen(false);
		setEditingItem(null);
		fetchCountries();
	};

	const handleCreateRegion = async (data: CreateRegionRequest | UpdateRegionRequest) => {
		if (!selectedCountry) return;
		await geographyService.createRegion(selectedCountry.id, data as CreateRegionRequest);
		toast.success('Region created');
		setCreateDialogOpen(false);
		fetchRegions(selectedCountry.id);
		fetchStats();
	};

	const handleEditRegion = async (data: CreateRegionRequest | UpdateRegionRequest) => {
		if (!editingItem) return;
		await geographyService.updateRegion(editingItem.id, data as UpdateRegionRequest);
		toast.success('Region updated');
		setEditDialogOpen(false);
		setEditingItem(null);
		if (selectedCountry) fetchRegions(selectedCountry.id);
	};

	const handleCreateCity = async (data: CreateCityRequest | UpdateCityRequest) => {
		if (!selectedRegion) return;
		await geographyService.createCity(selectedRegion.id, data as CreateCityRequest);
		toast.success('City created');
		setCreateDialogOpen(false);
		fetchCities(selectedRegion.id);
		fetchStats();
	};

	const handleEditCity = async (data: CreateCityRequest | UpdateCityRequest) => {
		if (!editingItem) return;
		await geographyService.updateCity(editingItem.id, data as UpdateCityRequest);
		toast.success('City updated');
		setEditDialogOpen(false);
		setEditingItem(null);
		if (selectedRegion) fetchCities(selectedRegion.id);
	};

	const handleCreateZone = async (data: CreatePricingZoneRequest | UpdatePricingZoneRequest) => {
		if (!selectedCity) return;
		await geographyService.createZone(selectedCity.id, data as CreatePricingZoneRequest);
		toast.success('Pricing zone created');
		setCreateDialogOpen(false);
		fetchZones(selectedCity.id);
		fetchStats();
	};

	const handleEditZone = async (data: CreatePricingZoneRequest | UpdatePricingZoneRequest) => {
		if (!editingItem) return;
		await geographyService.updateZone(editingItem.id, data as UpdatePricingZoneRequest);
		toast.success('Pricing zone updated');
		setEditDialogOpen(false);
		setEditingItem(null);
		if (selectedCity) fetchZones(selectedCity.id);
	};

	// Level labels
	const levelLabels: Record<GeoLevel, string> = {
		countries: 'Countries',
		regions: 'Regions',
		cities: 'Cities',
		zones: 'Pricing Zones',
	};

	const levelIcons: Record<GeoLevel, React.ReactNode> = {
		countries: <IconWorld className='h-5 w-5' />,
		regions: <IconMap2 className='h-5 w-5' />,
		cities: <IconBuildings className='h-5 w-5' />,
		zones: <IconMapPin className='h-5 w-5' />,
	};

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Geography Management</h1>
					<p className='text-sm text-muted-foreground'>
						Manage countries, regions, cities, and pricing zones
					</p>
				</div>
				<Button
					variant='outline'
					size='sm'
					onClick={fetchCurrentLevel}
				>
					<IconRefresh className='h-4 w-4' />
					Refresh
				</Button>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Countries</CardDescription>
						<IconWorld className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						{isLoadingStats ? (
							<Skeleton className='h-7 w-12' />
						) : (
							<div className='text-2xl font-bold'>{stats?.countries.total ?? 0}</div>
						)}
						<p className='text-xs text-muted-foreground mt-1'>
							{stats?.countries.active ?? 0} active
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Regions</CardDescription>
						<IconMap2 className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						{isLoadingStats ? (
							<Skeleton className='h-7 w-12' />
						) : (
							<div className='text-2xl font-bold'>{stats?.regions.total ?? 0}</div>
						)}
						<p className='text-xs text-muted-foreground mt-1'>
							{stats?.regions.active ?? 0} active
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Cities</CardDescription>
						<IconBuildings className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						{isLoadingStats ? (
							<Skeleton className='h-7 w-12' />
						) : (
							<div className='text-2xl font-bold'>{stats?.cities.total ?? 0}</div>
						)}
						<p className='text-xs text-muted-foreground mt-1'>
							{stats?.cities.active ?? 0} active
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Pricing Zones</CardDescription>
						<IconMapPin className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						{isLoadingStats ? (
							<Skeleton className='h-7 w-12' />
						) : (
							<div className='text-2xl font-bold'>{stats?.pricing_zones.total ?? 0}</div>
						)}
						<p className='text-xs text-muted-foreground mt-1'>
							{stats?.pricing_zones.active ?? 0} active
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Breadcrumb Navigation */}
			<nav className='flex items-center gap-1 text-sm'>
				<button
					onClick={() => handleNavigate('countries')}
					className={`transition-colors hover:text-foreground ${currentLevel === 'countries' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
				>
					Countries
				</button>
				{selectedCountry && (
					<>
						<IconChevronRight className='h-4 w-4 text-muted-foreground' />
						<button
							onClick={() => handleNavigate('regions')}
							className={`transition-colors hover:text-foreground ${currentLevel === 'regions' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
						>
							{selectedCountry.name}
						</button>
					</>
				)}
				{selectedRegion && (
					<>
						<IconChevronRight className='h-4 w-4 text-muted-foreground' />
						<button
							onClick={() => handleNavigate('cities')}
							className={`transition-colors hover:text-foreground ${currentLevel === 'cities' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
						>
							{selectedRegion.name}
						</button>
					</>
				)}
				{selectedCity && (
					<>
						<IconChevronRight className='h-4 w-4 text-muted-foreground' />
						<span className='text-foreground font-medium'>{selectedCity.name}</span>
					</>
				)}
			</nav>

			{/* Content Card */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							{levelIcons[currentLevel]}
							<div>
								<CardTitle>{levelLabels[currentLevel]}</CardTitle>
								<CardDescription>
									{currentLevel === 'countries' && 'All countries on the platform'}
									{currentLevel === 'regions' &&
										`Regions in ${selectedCountry?.name}`}
									{currentLevel === 'cities' &&
										`Cities in ${selectedRegion?.name}`}
									{currentLevel === 'zones' &&
										`Pricing zones in ${selectedCity?.name}`}
								</CardDescription>
							</div>
						</div>
						<Button onClick={() => setCreateDialogOpen(true)}>
							<IconPlus className='h-4 w-4 mr-2' />
							Add {currentLevel === 'countries' ? 'Country' : currentLevel === 'cities' ? 'City' : currentLevel === 'zones' ? 'Zone' : 'Region'}
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{/* Search */}
					<div className='mb-4'>
						<div className='relative max-w-md'>
							<IconSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
							<Input
								placeholder={`Search ${levelLabels[currentLevel].toLowerCase()}...`}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleSearch();
								}}
								className='pl-9'
							/>
						</div>
					</div>

					{/* Table */}
					{currentLevel === 'countries' && (
						<CountriesTable
							countries={countries}
							isLoading={isLoading}
							pagination={pagination}
							onPageChange={handlePageChange}
							onAction={handleCountryAction}
						/>
					)}
					{currentLevel === 'regions' && (
						<RegionsTable
							regions={regions}
							isLoading={isLoading}
							pagination={pagination}
							onPageChange={handlePageChange}
							onAction={handleRegionAction}
						/>
					)}
					{currentLevel === 'cities' && (
						<CitiesTable
							cities={cities}
							isLoading={isLoading}
							pagination={pagination}
							onPageChange={handlePageChange}
							onAction={handleCityAction}
						/>
					)}
					{currentLevel === 'zones' && (
						<ZonesTable
							zones={zones}
							isLoading={isLoading}
							pagination={pagination}
							onPageChange={handlePageChange}
							onAction={handleZoneAction}
						/>
					)}
				</CardContent>
			</Card>

			{/* Create Dialogs */}
			{currentLevel === 'countries' && (
				<CountryFormDialog
					open={createDialogOpen}
					onOpenChange={setCreateDialogOpen}
					onSubmit={handleCreateCountry}
				/>
			)}
			{currentLevel === 'regions' && (
				<RegionFormDialog
					open={createDialogOpen}
					onOpenChange={setCreateDialogOpen}
					onSubmit={handleCreateRegion}
				/>
			)}
			{currentLevel === 'cities' && (
				<CityFormDialog
					open={createDialogOpen}
					onOpenChange={setCreateDialogOpen}
					onSubmit={handleCreateCity}
				/>
			)}
			{currentLevel === 'zones' && (
				<ZoneFormDialog
					open={createDialogOpen}
					onOpenChange={setCreateDialogOpen}
					onSubmit={handleCreateZone}
				/>
			)}

			{/* Edit Dialogs — uses editingLevel to ensure correct dialog shows */}
			{editingLevel === 'countries' && (
				<CountryFormDialog
					open={editDialogOpen}
					onOpenChange={(open) => {
						setEditDialogOpen(open);
						if (!open) setEditingItem(null);
					}}
					initialData={editingItem as Country | null}
					onSubmit={handleEditCountry}
				/>
			)}
			{editingLevel === 'regions' && (
				<RegionFormDialog
					open={editDialogOpen}
					onOpenChange={(open) => {
						setEditDialogOpen(open);
						if (!open) setEditingItem(null);
					}}
					initialData={editingItem as Region | null}
					onSubmit={handleEditRegion}
				/>
			)}
			{editingLevel === 'cities' && (
				<CityFormDialog
					open={editDialogOpen}
					onOpenChange={(open) => {
						setEditDialogOpen(open);
						if (!open) setEditingItem(null);
					}}
					initialData={editingItem as City | null}
					onSubmit={handleEditCity}
				/>
			)}
			{editingLevel === 'zones' && (
				<ZoneFormDialog
					open={editDialogOpen}
					onOpenChange={(open) => {
						setEditDialogOpen(open);
						if (!open) setEditingItem(null);
					}}
					initialData={editingItem as PricingZone | null}
					onSubmit={handleEditZone}
				/>
			)}
		</div>
	);
}
