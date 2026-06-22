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
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const surgeSchema = z
	.object({
		demand_supply_ratio_min: z.string().min(1, 'Ratio min is required'),
		demand_supply_ratio_max: z.string(),
		multiplier: z.string().min(1, 'Multiplier is required'),
		is_active: z.boolean(),
	})
	.refine((d) => Number(d.demand_supply_ratio_min) > 0, {
		message: 'Must be greater than 0',
		path: ['demand_supply_ratio_min'],
	})
	.refine((d) => Number(d.multiplier) >= 1, {
		message: 'Multiplier must be at least 1.0',
		path: ['multiplier'],
	})
	.refine(
		(d) =>
			!d.demand_supply_ratio_max ||
			Number(d.demand_supply_ratio_max) > Number(d.demand_supply_ratio_min),
		{ message: 'Ratio max must be greater than ratio min', path: ['demand_supply_ratio_max'] },
	);

type SurgeFormValues = z.infer<typeof surgeSchema>;

const DEFAULT_VALUES: SurgeFormValues = {
	demand_supply_ratio_min: '1.5',
	demand_supply_ratio_max: '2',
	multiplier: '1.3',
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
	const [formLocation, setFormLocation] = useState<{
		country_id?: string;
		region_id?: string;
		city_id?: string;
	}>({});
	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<SurgeFormValues>({
		resolver: zodResolver(surgeSchema),
		defaultValues: DEFAULT_VALUES,
	});

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
		setFormLocation({ country_id: countryId, region_id: regionId, city_id: cityId });
		reset(DEFAULT_VALUES);
		setDialogOpen(true);
	};

	const handleOpenEdit = (item: SurgeThreshold) => {
		setEditingItem(item);
		setFormLocation({
			country_id: item.country_id,
			region_id: item.region_id,
			city_id: item.city_id,
		});
		reset({
			demand_supply_ratio_min: item.demand_supply_ratio_min.toString(),
			demand_supply_ratio_max: item.demand_supply_ratio_max?.toString() ?? '',
			multiplier: item.multiplier.toString(),
			is_active: item.is_active,
		});
		setDialogOpen(true);
	};

	const onSubmit = async (values: SurgeFormValues) => {
		try {
			const payload = {
				demand_supply_ratio_min: Number(values.demand_supply_ratio_min),
				demand_supply_ratio_max: values.demand_supply_ratio_max
					? Number(values.demand_supply_ratio_max)
					: undefined,
				multiplier: Number(values.multiplier),
				is_active: values.is_active,
				...formLocation,
			};
			if (editingItem) {
				await pricingService.updateSurgeThreshold(editingItem.id, payload);
				toast.success('Surge threshold updated');
			} else {
				await pricingService.createSurgeThreshold(versionId, {
					...payload,
					version_id: versionId,
				});
				toast.success('Surge threshold created');
			}
			setDialogOpen(false);
			fetchData();
			onRefresh?.();
		} catch {
			toast.error(editingItem ? 'Failed to update threshold' : 'Failed to create threshold');
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
					<form onSubmit={handleSubmit(onSubmit)}>
						<div className='grid gap-4 py-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div className='grid gap-2'>
									<Label htmlFor='demand_supply_ratio_min'>Ratio Min</Label>
									<Input
										id='demand_supply_ratio_min'
										type='number'
										step={0.1}
										min={0}
										aria-invalid={!!errors.demand_supply_ratio_min}
										{...register('demand_supply_ratio_min')}
									/>
									{errors.demand_supply_ratio_min && (
										<p className='text-xs text-destructive'>
											{errors.demand_supply_ratio_min.message}
										</p>
									)}
								</div>
								<div className='grid gap-2'>
									<Label htmlFor='demand_supply_ratio_max'>Ratio Max</Label>
									<Input
										id='demand_supply_ratio_max'
										type='number'
										step={0.1}
										min={0}
										aria-invalid={!!errors.demand_supply_ratio_max}
										{...register('demand_supply_ratio_max')}
									/>
									{errors.demand_supply_ratio_max && (
										<p className='text-xs text-destructive'>
											{errors.demand_supply_ratio_max.message}
										</p>
									)}
								</div>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='multiplier'>Multiplier</Label>
								<Input
									id='multiplier'
									type='number'
									step={0.1}
									min={1.0}
									aria-invalid={!!errors.multiplier}
									{...register('multiplier')}
								/>
								{errors.multiplier && (
									<p className='text-xs text-destructive'>{errors.multiplier.message}</p>
								)}
							</div>
							<div className='flex items-center justify-between'>
								<Label htmlFor='is_active'>Active</Label>
								<Controller
									control={control}
									name='is_active'
									render={({ field }) => (
										<Switch
											id='is_active'
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									)}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => setDialogOpen(false)}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isSubmitting}>
								{isSubmitting ? 'Saving...' : editingItem ? 'Update' : 'Create'}
							</Button>
						</DialogFooter>
					</form>
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
