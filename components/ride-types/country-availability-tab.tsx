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
import { CountryRideTypeWithDetails, RideType } from '@/lib/types/ride-types';
import { Country } from '@/lib/types/geography';
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

export function CountryAvailabilityTab() {
	const [countries, setCountries] = useState<Country[]>([]);
	const [selectedCountryId, setSelectedCountryId] = useState<string>('');
	const [data, setData] = useState<CountryRideTypeWithDetails[]>([]);
	const [globalRideTypes, setGlobalRideTypes] = useState<RideType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingCountries, setIsLoadingCountries] = useState(true);

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<CountryRideTypeWithDetails | null>(null);
	const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Delete state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deletingItem, setDeletingItem] = useState<CountryRideTypeWithDetails | null>(null);

	// Fetch countries
	useEffect(() => {
		const fetchCountries = async () => {
			try {
				setIsLoadingCountries(true);
				const response = await geographyService.getCountries({ limit: 100 });
				setCountries(response.data);
			} catch {
				toast.error('Failed to load countries');
			} finally {
				setIsLoadingCountries(false);
			}
		};
		fetchCountries();
	}, []);

	// Fetch global ride types (for the add dialog)
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

	const fetchData = useCallback(async () => {
		if (!selectedCountryId) return;
		setIsLoading(true);
		try {
			const response = await rideTypesService.getCountryRideTypes(selectedCountryId, {
				include_inactive: true,
			});
			setData(response);
		} catch {
			toast.error('Failed to load country ride types');
		} finally {
			setIsLoading(false);
		}
	}, [selectedCountryId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Available ride types not yet assigned to this country
	const availableRideTypes = useMemo(() => {
		const assignedIds = new Set(data.map((d) => d.ride_type_id));
		return globalRideTypes.filter((rt) => !assignedIds.has(rt.id));
	}, [globalRideTypes, data]);

	const handleOpenCreate = () => {
		setEditingItem(null);
		setFormData({ ...DEFAULT_FORM });
		setDialogOpen(true);
	};

	const handleOpenEdit = (item: CountryRideTypeWithDetails) => {
		setEditingItem(item);
		setFormData({
			ride_type_id: item.ride_type_id,
			is_active: item.is_active,
			sort_order: item.sort_order,
		});
		setDialogOpen(true);
	};

	const handleSubmit = async () => {
		if (!selectedCountryId) return;
		if (!editingItem && !formData.ride_type_id) {
			toast.error('Please select a ride type');
			return;
		}
		setIsSubmitting(true);
		try {
			if (editingItem) {
				await rideTypesService.updateCountryRideType(
					selectedCountryId,
					editingItem.ride_type_id,
					{ is_active: formData.is_active, sort_order: formData.sort_order }
				);
				toast.success('Country ride type updated');
			} else {
				await rideTypesService.addRideTypeToCountry(selectedCountryId, {
					ride_type_id: formData.ride_type_id,
					is_active: formData.is_active,
					sort_order: formData.sort_order,
				});
				toast.success('Ride type added to country');
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
		if (!deletingItem || !selectedCountryId) return;
		try {
			await rideTypesService.removeRideTypeFromCountry(
				selectedCountryId,
				deletingItem.ride_type_id
			);
			toast.success('Ride type removed from country');
			setDeleteDialogOpen(false);
			setDeletingItem(null);
			fetchData();
		} catch {
			toast.error('Failed to remove ride type');
		}
	};

	const columns: ColumnDef<CountryRideTypeWithDetails>[] = useMemo(
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
			{/* Country selector */}
			<div className='flex flex-wrap items-end justify-between gap-3'>
				<div className='space-y-2'>
					<Label>Select Country</Label>
					{isLoadingCountries ? (
						<Skeleton className='h-10 w-64' />
					) : (
						<Select
							value={selectedCountryId}
							onValueChange={setSelectedCountryId}
						>
							<SelectTrigger className='w-64'>
								<SelectValue placeholder='Choose a country' />
							</SelectTrigger>
							<SelectContent>
								{countries.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name} ({c.code})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>
				{selectedCountryId && (
					<Button onClick={handleOpenCreate} disabled={availableRideTypes.length === 0}>
						<IconPlus className='mr-2 h-4 w-4' />
						Add Ride Type
					</Button>
				)}
			</div>

			{!selectedCountryId ? (
				<div className='flex flex-col items-center justify-center rounded-md border py-12 text-center'>
					<p className='text-sm text-muted-foreground'>
						Select a country to manage ride type availability
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
										No ride types assigned to this country.
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
							{editingItem ? 'Edit Country Ride Type' : 'Add Ride Type to Country'}
						</DialogTitle>
						<DialogDescription>
							{editingItem
								? 'Update the ride type settings for this country.'
								: 'Enable a ride type for the selected country.'}
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
							country? This action cannot be undone.
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
