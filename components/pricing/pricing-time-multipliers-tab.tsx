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

interface FormData {
	name: string;
	days_of_week: number[];
	start_time: string;
	end_time: string;
	multiplier: number;
	priority: number;
	is_active: boolean;
	country_id?: string;
	region_id?: string;
	city_id?: string;
}

const DEFAULT_FORM: FormData = {
	name: '',
	days_of_week: [0, 1, 2, 3, 4, 5, 6],
	start_time: '07:00',
	end_time: '09:00',
	multiplier: 1.3,
	priority: 0,
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
	const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
	const [isSubmitting, setIsSubmitting] = useState(false);

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
		setFormData({ ...DEFAULT_FORM, country_id: countryId, region_id: regionId, city_id: cityId });
		setDialogOpen(true);
	};

	const handleOpenEdit = (item: TimeMultiplier) => {
		setEditingItem(item);
		setFormData({
			name: item.name,
			days_of_week: item.days_of_week,
			start_time: item.start_time,
			end_time: item.end_time,
			multiplier: item.multiplier,
			priority: item.priority,
			is_active: item.is_active,
			country_id: item.country_id,
			region_id: item.region_id,
			city_id: item.city_id,
		});
		setDialogOpen(true);
	};

	const handleSubmit = async () => {
		if (!formData.name.trim()) {
			toast.error('Name is required');
			return;
		}
		if (formData.days_of_week.length === 0) {
			toast.error('Select at least one day');
			return;
		}
		if (formData.start_time >= formData.end_time) {
			toast.error('Start time must be before end time');
			return;
		}
		if (formData.multiplier < 1.0) {
			toast.error('Multiplier must be at least 1.0');
			return;
		}
		setIsSubmitting(true);
		try {
			const payload = {
				...formData,
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
		} finally {
			setIsSubmitting(false);
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

	const toggleDay = (day: number) => {
		setFormData((prev) => ({
			...prev,
			days_of_week: prev.days_of_week.includes(day)
				? prev.days_of_week.filter((d) => d !== day)
				: [...prev.days_of_week, day].sort((a, b) => a - b),
		}));
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
					<div className='grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='name'>Name</Label>
							<Input
								id='name'
								value={formData.name}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, name: e.target.value }))
								}
								placeholder='e.g., Morning Rush Hour'
							/>
						</div>
						<div className='grid gap-2'>
							<Label>Days of Week</Label>
							<div className='flex flex-wrap gap-3'>
								{[0, 1, 2, 3, 4, 5, 6].map((day) => (
									<div key={day} className='flex items-center gap-1.5'>
										<Checkbox
											id={`day-${day}`}
											checked={formData.days_of_week.includes(day)}
											onCheckedChange={() => toggleDay(day)}
										/>
										<Label htmlFor={`day-${day}`} className='text-sm font-normal cursor-pointer'>
											{DAY_NAMES_FULL[day]}
										</Label>
									</div>
								))}
							</div>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='grid gap-2'>
								<Label htmlFor='start_time'>Start Time</Label>
								<Input
									id='start_time'
									type='time'
									value={formData.start_time}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											start_time: e.target.value,
										}))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='end_time'>End Time</Label>
								<Input
									id='end_time'
									type='time'
									value={formData.end_time}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											end_time: e.target.value,
										}))
									}
								/>
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
									value={formData.multiplier}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											multiplier: parseFloat(e.target.value) || 1.0,
										}))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='priority'>Priority</Label>
								<Input
									id='priority'
									type='number'
									min={0}
									value={formData.priority}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											priority: parseInt(e.target.value, 10) || 0,
										}))
									}
								/>
							</div>
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
