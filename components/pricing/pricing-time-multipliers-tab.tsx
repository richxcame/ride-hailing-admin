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
import { TimeMultiplier } from '@/lib/types/pricing';
import { pricingService } from '@/lib/api/pricing.service';
import { LocationFilter } from '@/components/pricing/location-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
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

interface PricingTimeMultipliersTabProps {
	versionId: string;
	onRefresh?: () => void;
}

const timeSchema = z
	.object({
		name: z.string().trim().min(1, 'Name is required'),
		days_of_week: z.array(z.number()).min(1, 'Select at least one day'),
		start_time: z.string().min(1, 'Start time is required'),
		end_time: z.string().min(1, 'End time is required'),
		multiplier: z.string().min(1, 'Multiplier is required'),
		priority: z.string(),
		is_active: z.boolean(),
	})
	.refine((d) => d.start_time < d.end_time, {
		message: 'Start time must be before end time',
		path: ['end_time'],
	})
	.refine((d) => Number(d.multiplier) >= 1, {
		message: 'Multiplier must be at least 1.0',
		path: ['multiplier'],
	});

type TimeFormValues = z.infer<typeof timeSchema>;

const DEFAULT_VALUES: TimeFormValues = {
	name: '',
	days_of_week: [0, 1, 2, 3, 4, 5, 6],
	start_time: '07:00',
	end_time: '09:00',
	multiplier: '1.3',
	priority: '0',
	is_active: true,
};

const DAY_NAMES: Record<number, string> = {
	0: 'Sun',
	1: 'Mon',
	2: 'Tue',
	3: 'Wed',
	4: 'Thu',
	5: 'Fri',
	6: 'Sat',
};

const DAY_NAMES_FULL: Record<number, string> = {
	0: 'Sunday',
	1: 'Monday',
	2: 'Tuesday',
	3: 'Wednesday',
	4: 'Thursday',
	5: 'Friday',
	6: 'Saturday',
};

function formatDays(days: number[]): string {
	if (!days || days.length === 0) return 'None';
	if (days.length === 7) return 'Every Day';

	const weekdays = [1, 2, 3, 4, 5];
	const weekend = [0, 6];
	if (weekdays.every((d) => days.includes(d)) && days.length === 5) return 'Weekdays';
	if (weekend.every((d) => days.includes(d)) && days.length === 2) return 'Weekends';

	return days.sort((a, b) => a - b).map((d) => DAY_NAMES[d]).join(', ');
}

export function PricingTimeMultipliersTab({ versionId, onRefresh }: PricingTimeMultipliersTabProps) {
	const [data, setData] = useState<TimeMultiplier[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState({ total: 0, limit: 10, offset: 0 });

	// Filter state
	const [countryId, setCountryId] = useState<string | undefined>();
	const [regionId, setRegionId] = useState<string | undefined>();
	const [cityId, setCityId] = useState<string | undefined>();

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<TimeMultiplier | null>(null);
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
	} = useForm<TimeFormValues>({
		resolver: zodResolver(timeSchema),
		defaultValues: DEFAULT_VALUES,
	});

	// Delete state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await pricingService.getTimeMultipliers(versionId, {
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
			toast.error('Failed to load time multipliers');
		} finally {
			setIsLoading(false);
		}
	}, [versionId, pagination.limit, pagination.offset, countryId, regionId, cityId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const getLocationLabel = (item: TimeMultiplier): string => {
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

	const handleOpenEdit = (item: TimeMultiplier) => {
		setEditingItem(item);
		setFormLocation({
			country_id: item.country_id,
			region_id: item.region_id,
			city_id: item.city_id,
		});
		reset({
			name: item.name,
			days_of_week: item.days_of_week,
			start_time: item.start_time,
			end_time: item.end_time,
			multiplier: item.multiplier.toString(),
			priority: item.priority.toString(),
			is_active: item.is_active,
		});
		setDialogOpen(true);
	};

	const onSubmit = async (values: TimeFormValues) => {
		try {
			const payload = {
				name: values.name.trim(),
				days_of_week: values.days_of_week,
				start_time: values.start_time,
				end_time: values.end_time,
				multiplier: Number(values.multiplier),
				priority: Number(values.priority) || 0,
				is_active: values.is_active,
				...formLocation,
				version_id: versionId,
			};
			if (editingItem) {
				await pricingService.updateTimeMultiplier(editingItem.id, payload);
				toast.success('Time multiplier updated');
			} else {
				await pricingService.createTimeMultiplier(versionId, payload);
				toast.success('Time multiplier created');
			}
			setDialogOpen(false);
			fetchData();
			onRefresh?.();
		} catch {
			toast.error(editingItem ? 'Failed to update time multiplier' : 'Failed to create time multiplier');
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			await pricingService.deleteTimeMultiplier(deletingId);
			toast.success('Time multiplier deleted');
			setDeleteDialogOpen(false);
			setDeletingId(null);
			fetchData();
			onRefresh?.();
		} catch {
			toast.error('Failed to delete time multiplier');
		}
	};

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	const columns: ColumnDef<TimeMultiplier>[] = useMemo(
		() => [
			{
				id: 'location',
				header: 'Location',
				cell: ({ row }) => (
					<span className='text-sm'>{getLocationLabel(row.original)}</span>
				),
			},
			{
				accessorKey: 'name',
				header: 'Name',
				cell: ({ row }) => (
					<span className='font-medium'>{row.original.name}</span>
				),
			},
			{
				id: 'days_of_week',
				header: 'Days',
				cell: ({ row }) => (
					<span className='text-sm'>
						{formatDays(row.original.days_of_week)}
					</span>
				),
			},
			{
				id: 'time_range',
				header: 'Time Range',
				cell: ({ row }) => (
					<span className='text-sm'>
						{row.original.start_time} - {row.original.end_time}
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
				accessorKey: 'priority',
				header: 'Priority',
				cell: ({ row }) => (
					<span className='text-sm'>{row.original.priority}</span>
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
					Add Time Rule
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
											No time multipliers found.
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
								of {pagination.total} rules
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
							{editingItem ? 'Edit Time Multiplier' : 'Add Time Multiplier'}
						</DialogTitle>
						<DialogDescription>
							{editingItem
								? 'Update the time-based multiplier configuration.'
								: 'Create a new time-based pricing multiplier.'}
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit(onSubmit)}>
						<div className='grid gap-4 py-4'>
							<div className='grid gap-2'>
								<Label htmlFor='name'>Name</Label>
								<Input
									id='name'
									placeholder='e.g., Morning Rush Hour'
									aria-invalid={!!errors.name}
									{...register('name')}
								/>
								{errors.name && (
									<p className='text-xs text-destructive'>{errors.name.message}</p>
								)}
							</div>
							<div className='grid gap-2'>
								<Label>Days of Week</Label>
								<Controller
									control={control}
									name='days_of_week'
									render={({ field }) => (
										<div className='flex flex-wrap gap-3'>
											{[0, 1, 2, 3, 4, 5, 6].map((day) => (
												<div key={day} className='flex items-center gap-1.5'>
													<Checkbox
														id={`day-${day}`}
														checked={field.value.includes(day)}
														onCheckedChange={() =>
															field.onChange(
																field.value.includes(day)
																	? field.value.filter((d) => d !== day)
																	: [...field.value, day].sort((a, b) => a - b),
															)
														}
													/>
													<Label
														htmlFor={`day-${day}`}
														className='text-sm font-normal cursor-pointer'
													>
														{DAY_NAMES_FULL[day]}
													</Label>
												</div>
											))}
										</div>
									)}
								/>
								{errors.days_of_week && (
									<p className='text-xs text-destructive'>{errors.days_of_week.message}</p>
								)}
							</div>
							<div className='grid grid-cols-2 gap-4'>
								<div className='grid gap-2'>
									<Label htmlFor='start_time'>Start Time</Label>
									<Input id='start_time' type='time' {...register('start_time')} />
								</div>
								<div className='grid gap-2'>
									<Label htmlFor='end_time'>End Time</Label>
									<Input
										id='end_time'
										type='time'
										aria-invalid={!!errors.end_time}
										{...register('end_time')}
									/>
									{errors.end_time && (
										<p className='text-xs text-destructive'>{errors.end_time.message}</p>
									)}
								</div>
							</div>
							<div className='grid grid-cols-2 gap-4'>
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
								<div className='grid gap-2'>
									<Label htmlFor='priority'>Priority</Label>
									<Input id='priority' type='number' min={0} {...register('priority')} />
								</div>
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
						<AlertDialogTitle>Delete Time Multiplier</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this time multiplier? This action
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
