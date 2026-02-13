'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import { SurgeThreshold } from '@/lib/types/pricing';
import { pricingService } from '@/lib/api/pricing.service';
import { LocationFilter } from '@/components/pricing/location-filter';
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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

interface PricingSurgeTabProps {
	versionId: string;
	onRefresh?: () => void;
}

interface FormData {
	demand_supply_ratio_min: number;
	demand_supply_ratio_max?: number;
	multiplier: number;
	is_active: boolean;
	country_id?: string;
	region_id?: string;
	city_id?: string;
}

const DEFAULT_FORM: FormData = {
	demand_supply_ratio_min: 1.5,
	demand_supply_ratio_max: 2.0,
	multiplier: 1.3,
	is_active: true,
};

export function PricingSurgeTab({ versionId, onRefresh }: PricingSurgeTabProps) {
	const [data, setData] = useState<SurgeThreshold[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState({ total: 0, limit: 10, offset: 0 });

	// Filter state
	const [countryId, setCountryId] = useState<string | undefined>();
	const [regionId, setRegionId] = useState<string | undefined>();
	const [cityId, setCityId] = useState<string | undefined>();

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<SurgeThreshold | null>(null);
	const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Delete state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await pricingService.getSurgeThresholds(versionId, {
				limit: pagination.limit,
				offset: pagination.offset,
				country_id: countryId,
				region_id: regionId,
				city_id: cityId,
			});
			setData(response.data);
			setPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));
		} catch {
			toast.error('Failed to load surge thresholds');
		} finally {
			setIsLoading(false);
		}
	}, [versionId, pagination.limit, pagination.offset, countryId, regionId, cityId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const getLocationLabel = (item: SurgeThreshold): string => {
		if (item.city_id) return `City: ${item.city_id.substring(0, 8)}...`;
		if (item.region_id) return `Region: ${item.region_id.substring(0, 8)}...`;
		if (item.country_id) return `Country: ${item.country_id.substring(0, 8)}...`;
		return 'Global';
	};

	const handleOpenCreate = () => {
		setEditingItem(null);
		setFormData({ ...DEFAULT_FORM, country_id: countryId, region_id: regionId, city_id: cityId });
		setDialogOpen(true);
	};

	const handleOpenEdit = (item: SurgeThreshold) => {
		setEditingItem(item);
		setFormData({
			demand_supply_ratio_min: item.demand_supply_ratio_min,
			demand_supply_ratio_max: item.demand_supply_ratio_max,
			multiplier: item.multiplier,
			is_active: item.is_active,
			country_id: item.country_id,
			region_id: item.region_id,
			city_id: item.city_id,
		});
		setDialogOpen(true);
	};

	const handleSubmit = async () => {
		if (formData.demand_supply_ratio_min <= 0) {
			toast.error('Demand/supply ratio min must be positive');
			return;
		}
		if (formData.demand_supply_ratio_max && formData.demand_supply_ratio_max <= formData.demand_supply_ratio_min) {
			toast.error('Demand/supply ratio max must be greater than ratio min');
			return;
		}
		if (formData.multiplier < 1.0) {
			toast.error('Multiplier must be at least 1.0');
			return;
		}
		setIsSubmitting(true);
		try {
			if (editingItem) {
				await pricingService.updateSurgeThreshold(editingItem.id, formData);
				toast.success('Surge threshold updated');
			} else {
				await pricingService.createSurgeThreshold(versionId, {
					...formData,
					version_id: versionId,
				});
				toast.success('Surge threshold created');
			}
			setDialogOpen(false);
			fetchData();
			onRefresh?.();
		} catch {
			toast.error(editingItem ? 'Failed to update threshold' : 'Failed to create threshold');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			await pricingService.deleteSurgeThreshold(deletingId);
			toast.success('Surge threshold deleted');
			setDeleteDialogOpen(false);
			setDeletingId(null);
			fetchData();
			onRefresh?.();
		} catch {
			toast.error('Failed to delete threshold');
		}
	};

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	const columns: ColumnDef<SurgeThreshold>[] = useMemo(
		() => [
			{
				id: 'location',
				header: 'Location',
				cell: ({ row }) => (
					<span className='text-sm'>{getLocationLabel(row.original)}</span>
				),
			},
			{
				id: 'demand_supply_ratio',
				header: 'Demand/Supply Ratio',
				cell: ({ row }) => (
					<span className='font-medium'>
						{row.original.demand_supply_ratio_min}x – {row.original.demand_supply_ratio_max ? `${row.original.demand_supply_ratio_max}x` : '∞'}
					</span>
				),
			},
			{
				accessorKey: 'multiplier',
				header: 'Multiplier',
				cell: ({ row }) => (
					<span className='font-medium'>{row.original.multiplier}x</span>
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
						<Button
							variant='ghost'
							size='sm'
							onClick={() => handleOpenEdit(row.original)}
						>
							<IconEdit className='h-4 w-4' />
						</Button>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => {
								setDeletingId(row.original.id);
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
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		state: { sorting },
	});

	const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
	const totalPages = Math.ceil(pagination.total / pagination.limit);

	return (
		<div className='space-y-4'>
			<div className='flex flex-wrap items-end justify-between gap-3'>
				<LocationFilter
					countryId={countryId}
					regionId={regionId}
					cityId={cityId}
					onCountryChange={(id) => {
						setCountryId(id);
						setPagination((prev) => ({ ...prev, offset: 0 }));
					}}
					onRegionChange={(id) => {
						setRegionId(id);
						setPagination((prev) => ({ ...prev, offset: 0 }));
					}}
					onCityChange={(id) => {
						setCityId(id);
						setPagination((prev) => ({ ...prev, offset: 0 }));
					}}
				/>
				<Button onClick={handleOpenCreate}>
					<IconPlus className='mr-2 h-4 w-4' />
					Add Threshold
				</Button>
			</div>

			{isLoading ? (
				<div className='space-y-2'>
					{[...Array(5)].map((_, i) => (
						<Skeleton key={i} className='h-12 w-full' />
					))}
				</div>
			) : (
				<div className='space-y-4'>
					<div className='rounded-md border'>
						<Table>
							<TableHeader>
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead key={header.id}>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
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
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={columns.length}
											className='h-24 text-center'
										>
											No surge thresholds found.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					{pagination.total > 0 && (
						<div className='flex items-center justify-between'>
							<p className='text-sm text-muted-foreground'>
								Showing {pagination.offset + 1} to{' '}
								{Math.min(pagination.offset + pagination.limit, pagination.total)}{' '}
								of {pagination.total} thresholds
							</p>
							<div className='flex items-center gap-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() =>
										handlePageChange(
											Math.max(0, pagination.offset - pagination.limit),
										)
									}
									disabled={pagination.offset === 0}
								>
									Previous
								</Button>
								<span className='text-sm'>
									Page {currentPage} of {totalPages}
								</span>
								<Button
									variant='outline'
									size='sm'
									onClick={() =>
										handlePageChange(pagination.offset + pagination.limit)
									}
									disabled={pagination.offset + pagination.limit >= pagination.total}
								>
									Next
								</Button>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Create/Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingItem ? 'Edit Surge Threshold' : 'Add Surge Threshold'}
						</DialogTitle>
						<DialogDescription>
							{editingItem
								? 'Update the surge threshold configuration.'
								: 'Create a new surge threshold for dynamic pricing.'}
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid grid-cols-2 gap-4'>
							<div className='grid gap-2'>
								<Label htmlFor='demand_supply_ratio_min'>Ratio Min</Label>
								<Input
									id='demand_supply_ratio_min'
									type='number'
									step={0.1}
									min={0}
									value={formData.demand_supply_ratio_min}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											demand_supply_ratio_min: parseFloat(e.target.value) || 0,
										}))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='demand_supply_ratio_max'>Ratio Max</Label>
								<Input
									id='demand_supply_ratio_max'
									type='number'
									step={0.1}
									min={0}
									value={formData.demand_supply_ratio_max}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											demand_supply_ratio_max: parseFloat(e.target.value) || 0,
										}))
									}
								/>
							</div>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='multiplier'>Multiplier</Label>
							<Input
								id='multiplier'
								type='number'
								step={0.1}
								min={1.0}
								value={formData.multiplier}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										multiplier: parseFloat(e.target.value) || 1.0,
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
						<Button
							variant='outline'
							onClick={() => setDialogOpen(false)}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={isSubmitting}>
							{isSubmitting
								? 'Saving...'
								: editingItem
									? 'Update'
									: 'Create'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Surge Threshold</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this surge threshold? This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeletingId(null)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
