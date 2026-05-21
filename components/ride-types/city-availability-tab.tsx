'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ColumnDef,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import { rideTypesService } from '@/lib/api/ride-types.service';
import { geographyService } from '@/lib/api/geography.service';
import { fetchAllPages } from '@/lib/api/paginate';
import { EntityCombobox } from '@/components/entity-combobox';
import { CityRideTypeWithDetails, RideType } from '@/lib/types/ride-types';
import { Country, Region, City } from '@/lib/types/geography';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

interface FormData {
	ride_type_id: string;
	is_active: boolean;
	sort_order: number;
}

const DEFAULT_FORM: FormData = {
	ride_type_id: '',
	is_active: true,
	sort_order: 0,
};

export function CityAvailabilityTab() {
	// Location selection
	const [countries, setCountries] = useState<Country[]>([]);
	const [regions, setRegions] = useState<Region[]>([]);
	const [cities, setCities] = useState<City[]>([]);
	const [selectedCountryId, setSelectedCountryId] = useState<string>('');
	const [selectedRegionId, setSelectedRegionId] = useState<string>('');
	const [selectedCityId, setSelectedCityId] = useState<string>('');
	const [isLoadingCountries, setIsLoadingCountries] = useState(true);
	const [isLoadingRegions, setIsLoadingRegions] = useState(false);
	const [isLoadingCities, setIsLoadingCities] = useState(false);

	// Data
	const [data, setData] = useState<CityRideTypeWithDetails[]>([]);
	const [globalRideTypes, setGlobalRideTypes] = useState<RideType[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<CityRideTypeWithDetails | null>(null);
	const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Delete state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deletingItem, setDeletingItem] = useState<CityRideTypeWithDetails | null>(null);

	// Fetch every country (the backend caps each page at 100, so paginate).
	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const all = await fetchAllPages((offset, limit) =>
					geographyService.getCountries({ offset, limit }),
				);
				if (active) setCountries(all);
			} catch {
				if (active) toast.error('Failed to load countries');
			} finally {
				if (active) setIsLoadingCountries(false);
			}
		})();
		return () => {
			active = false;
		};
	}, []);

	// Fetch global ride types
	useEffect(() => {
		const fetchGlobalRideTypes = async () => {
			try {
				const response = await rideTypesService.getRideTypes({ limit: 100, include_inactive: true });
				setGlobalRideTypes(response.data);
			} catch {
				toast.error('Failed to load ride types');
			}
		};
		fetchGlobalRideTypes();
	}, []);

	// Load every region for the selected country (paginate to bypass the
	// 100-per-page backend cap).
	useEffect(() => {
		if (!selectedCountryId) return;
		let active = true;
		(async () => {
			try {
				const all = await fetchAllPages((offset, limit) =>
					geographyService.getRegions(selectedCountryId, { offset, limit }),
				);
				if (active) setRegions(all);
			} catch {
				if (active) toast.error('Failed to load regions');
			} finally {
				if (active) setIsLoadingRegions(false);
			}
		})();
		return () => {
			active = false;
		};
	}, [selectedCountryId]);

	// Load every city for the selected region (paginated, see above).
	useEffect(() => {
		if (!selectedRegionId) return;
		let active = true;
		(async () => {
			try {
				const all = await fetchAllPages((offset, limit) =>
					geographyService.getCities(selectedRegionId, { offset, limit }),
				);
				if (active) setCities(all);
			} catch {
				if (active) toast.error('Failed to load cities');
			} finally {
				if (active) setIsLoadingCities(false);
			}
		})();
		return () => {
			active = false;
		};
	}, [selectedRegionId]);

	// Fetch ride types for selected city
	const fetchData = useCallback(async () => {
		if (!selectedCityId) return;
		setIsLoading(true);
		try {
			const response = await rideTypesService.getCityRideTypes(selectedCityId, {
				include_inactive: true,
			});
			setData(response);
		} catch {
			toast.error('Failed to load city ride types');
		} finally {
			setIsLoading(false);
		}
	}, [selectedCityId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const availableRideTypes = useMemo(() => {
		const assignedIds = new Set(data.map((d) => d.ride_type_id));
		return globalRideTypes.filter((rt) => !assignedIds.has(rt.id));
	}, [globalRideTypes, data]);

	const handleOpenCreate = () => {
		setEditingItem(null);
		setFormData({ ...DEFAULT_FORM });
		setDialogOpen(true);
	};

	const handleOpenEdit = (item: CityRideTypeWithDetails) => {
		setEditingItem(item);
		setFormData({
			ride_type_id: item.ride_type_id,
			is_active: item.is_active,
			sort_order: item.sort_order,
		});
		setDialogOpen(true);
	};

	const handleSubmit = async () => {
		if (!selectedCityId) return;
		if (!editingItem && !formData.ride_type_id) {
			toast.error('Please select a ride type');
			return;
		}
		setIsSubmitting(true);
		try {
			if (editingItem) {
				await rideTypesService.updateCityRideType(
					selectedCityId,
					editingItem.ride_type_id,
					{ is_active: formData.is_active, sort_order: formData.sort_order }
				);
				toast.success('City ride type updated');
			} else {
				await rideTypesService.addRideTypeToCity(selectedCityId, {
					ride_type_id: formData.ride_type_id,
					is_active: formData.is_active,
					sort_order: formData.sort_order,
				});
				toast.success('Ride type added to city');
			}
			setDialogOpen(false);
			fetchData();
		} catch {
			toast.error(editingItem ? 'Failed to update' : 'Failed to add ride type');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!deletingItem || !selectedCityId) return;
		try {
			await rideTypesService.removeRideTypeFromCity(selectedCityId, deletingItem.ride_type_id);
			toast.success('Ride type removed from city');
			setDeleteDialogOpen(false);
			setDeletingItem(null);
			fetchData();
		} catch {
			toast.error('Failed to remove ride type');
		}
	};

	const columns: ColumnDef<CityRideTypeWithDetails>[] = useMemo(
		() => [
			{
				id: 'name',
				header: 'Ride Type',
				cell: ({ row }) => (
					<div>
						<span className='font-medium'>{row.original.ride_type_name}</span>
						{row.original.ride_type_icon && (
							<span className='ml-2 text-muted-foreground'>{row.original.ride_type_icon}</span>
						)}
					</div>
				),
			},
			{
				accessorKey: 'ride_type_capacity',
				header: 'Capacity',
				cell: ({ row }) => (
					<span className='text-sm'>{row.original.ride_type_capacity} passengers</span>
				),
			},
			{
				accessorKey: 'sort_order',
				header: 'Sort Order',
				cell: ({ row }) => (
					<span className='text-sm font-mono'>{row.original.sort_order}</span>
				),
			},
			{
				accessorKey: 'is_active',
				header: 'Status',
				cell: ({ row }) => (
					<Badge variant={row.original.is_active ? 'default' : 'secondary'}>
						{row.original.is_active ? 'Active' : 'Inactive'}
					</Badge>
				),
			},
			{
				id: 'actions',
				header: '',
				cell: ({ row }) => (
					<div className='flex items-center gap-1'>
						<Button variant='ghost' size='sm' onClick={() => handleOpenEdit(row.original)}>
							<IconEdit className='h-4 w-4' />
						</Button>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => {
								setDeletingItem(row.original);
								setDeleteDialogOpen(true);
							}}
						>
							<IconTrash className='h-4 w-4 text-destructive' />
						</Button>
					</div>
				),
			},
		],
		[],
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
	});

	return (
		<div className='space-y-4'>
			{/* Cascading location selectors */}
			<div className='flex flex-wrap items-end gap-3'>
				<div className='space-y-2'>
					<Label>Country</Label>
					<EntityCombobox
						items={countries.map((c) => ({
							id: c.id,
							label: `${c.name}${c.code ? ` (${c.code})` : ''}`,
						}))}
						value={selectedCountryId}
						onChange={setSelectedCountryId}
						placeholder='Search countries…'
						emptyMessage='No countries found'
						isLoading={isLoadingCountries}
						className='w-48'
					/>
				</div>

				<div className='space-y-2'>
					<Label>Region</Label>
					<EntityCombobox
						items={regions.map((r) => ({ id: r.id, label: r.name }))}
						value={selectedRegionId}
						onChange={setSelectedRegionId}
						placeholder='Search regions…'
						emptyMessage='No regions found'
						isLoading={isLoadingRegions}
						disabled={!selectedCountryId}
						className='w-48'
					/>
				</div>

				<div className='space-y-2'>
					<Label>City</Label>
					<EntityCombobox
						items={cities.map((c) => ({ id: c.id, label: c.name }))}
						value={selectedCityId}
						onChange={setSelectedCityId}
						placeholder='Search cities…'
						emptyMessage='No cities found'
						isLoading={isLoadingCities}
						disabled={!selectedRegionId}
						className='w-48'
					/>
				</div>

				{selectedCityId && (
					<Button onClick={handleOpenCreate} disabled={availableRideTypes.length === 0}>
						<IconPlus className='mr-2 h-4 w-4' />
						Add Ride Type
					</Button>
				)}
			</div>

			{!selectedCityId ? (
				<div className='flex flex-col items-center justify-center rounded-md border py-12 text-center'>
					<p className='text-sm text-muted-foreground'>
						Select a country, region, and city to manage ride type availability
					</p>
				</div>
			) : isLoading ? (
				<div className='space-y-2'>
					{[...Array(3)].map((_, i) => (
						<Skeleton key={i} className='h-12 w-full' />
					))}
				</div>
			) : (
				<div className='rounded-md border'>
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows?.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className='h-24 text-center'>
										No ride types assigned to this city.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Create/Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingItem ? 'Edit City Ride Type' : 'Add Ride Type to City'}
						</DialogTitle>
						<DialogDescription>
							{editingItem
								? 'Update the ride type settings for this city.'
								: 'Enable a ride type for the selected city. City-level settings override country-level.'}
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						{!editingItem && (
							<div className='grid gap-2'>
								<Label htmlFor='ride_type'>Ride Type</Label>
								<Select
									value={formData.ride_type_id}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, ride_type_id: value }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder='Select a ride type' />
									</SelectTrigger>
									<SelectContent>
										{availableRideTypes.map((rt) => (
											<SelectItem key={rt.id} value={rt.id}>
												{rt.name} (capacity: {rt.capacity})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
						<div className='grid gap-2'>
							<Label htmlFor='sort_order'>Sort Order</Label>
							<Input
								id='sort_order'
								type='number'
								min={0}
								value={formData.sort_order}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										sort_order: parseInt(e.target.value) || 0,
									}))
								}
							/>
						</div>
						<div className='flex items-center justify-between'>
							<Label htmlFor='is_active'>Active</Label>
							<Switch
								id='is_active'
								checked={formData.is_active}
								onCheckedChange={(checked) =>
									setFormData((prev) => ({ ...prev, is_active: checked }))
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant='outline' onClick={() => setDialogOpen(false)} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={isSubmitting}>
							{isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Add'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove Ride Type</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to remove &quot;{deletingItem?.ride_type_name}&quot; from this
							city? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeletingItem(null)}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
							Remove
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
