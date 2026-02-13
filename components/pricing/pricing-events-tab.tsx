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
import { EventMultiplier, EventType } from '@/lib/types/pricing';
import { pricingService } from '@/lib/api/pricing.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
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

interface PricingEventsTabProps {
	versionId: string;
	onRefresh?: () => void;
}

interface FormData {
	event_name: string;
	event_type: EventType;
	starts_at: string;
	ends_at: string;
	pre_event_minutes: number;
	post_event_minutes: number;
	multiplier: number;
	expected_demand_increase?: number;
	is_active: boolean;
	city_id?: string;
	zone_id?: string;
}

const DEFAULT_FORM: FormData = {
	event_name: '',
	event_type: 'concert',
	starts_at: '',
	ends_at: '',
	pre_event_minutes: 60,
	post_event_minutes: 30,
	multiplier: 1.5,
	is_active: true,
};

const EVENT_TYPE_COLORS: Record<EventType, string> = {
	sports: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
	concert: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
	conference: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
	holiday: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
	festival: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
	other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const EVENT_TYPE_LABELS: Record<EventType, string> = {
	sports: 'Sports',
	concert: 'Concert',
	conference: 'Conference',
	holiday: 'Holiday',
	festival: 'Festival',
	other: 'Other',
};

function getEventStatus(startsAt: string, endsAt: string): { label: string; variant: 'default' | 'secondary' | 'outline' } {
	const now = new Date();
	const start = new Date(startsAt);
	const end = new Date(endsAt);

	if (now < start) return { label: 'Upcoming', variant: 'outline' };
	if (now >= start && now <= end) return { label: 'In Progress', variant: 'default' };
	return { label: 'Past', variant: 'secondary' };
}

function formatDateRange(startsAt: string, endsAt: string): string {
	const start = new Date(startsAt);
	const end = new Date(endsAt);
	const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
	return `${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)}`;
}

export function PricingEventsTab({ versionId, onRefresh }: PricingEventsTabProps) {
	const [data, setData] = useState<EventMultiplier[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState({ total: 0, limit: 10, offset: 0 });

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<EventMultiplier | null>(null);
	const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Delete state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await pricingService.getEventMultipliers(versionId, {
				limit: pagination.limit,
				offset: pagination.offset,
			});
			setData(response.data);
			setPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));
		} catch {
			toast.error('Failed to load event multipliers');
		} finally {
			setIsLoading(false);
		}
	}, [versionId, pagination.limit, pagination.offset]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const getLocationLabel = (item: EventMultiplier): string => {
		if (item.zone_id) return `Zone: ${item.zone_id.substring(0, 8)}...`;
		if (item.city_id) return `City: ${item.city_id.substring(0, 8)}...`;
		return 'Global';
	};

	const handleOpenCreate = () => {
		setEditingItem(null);
		setFormData({ ...DEFAULT_FORM });
		setDialogOpen(true);
	};

	const handleOpenEdit = (item: EventMultiplier) => {
		setEditingItem(item);
		setFormData({
			event_name: item.event_name,
			event_type: item.event_type,
			starts_at: item.starts_at ? new Date(item.starts_at).toISOString().slice(0, 16) : '',
			ends_at: item.ends_at ? new Date(item.ends_at).toISOString().slice(0, 16) : '',
			pre_event_minutes: item.pre_event_minutes,
			post_event_minutes: item.post_event_minutes,
			multiplier: item.multiplier,
			expected_demand_increase: item.expected_demand_increase,
			is_active: item.is_active,
			city_id: item.city_id,
			zone_id: item.zone_id,
		});
		setDialogOpen(true);
	};

	const handleSubmit = async () => {
		if (!formData.event_name.trim()) {
			toast.error('Event name is required');
			return;
		}
		if (!formData.starts_at || !formData.ends_at) {
			toast.error('Start and end times are required');
			return;
		}
		if (formData.ends_at <= formData.starts_at) {
			toast.error('End time must be after start time');
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
				starts_at: new Date(formData.starts_at).toISOString(),
				ends_at: new Date(formData.ends_at).toISOString(),
				version_id: versionId,
			};
			if (editingItem) {
				await pricingService.updateEventMultiplier(editingItem.id, payload);
				toast.success('Event multiplier updated');
			} else {
				await pricingService.createEventMultiplier(versionId, payload);
				toast.success('Event multiplier created');
			}
			setDialogOpen(false);
			fetchData();
			onRefresh?.();
		} catch {
			toast.error(
				editingItem ? 'Failed to update event multiplier' : 'Failed to create event multiplier',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			await pricingService.deleteEventMultiplier(deletingId);
			toast.success('Event multiplier deleted');
			setDeleteDialogOpen(false);
			setDeletingId(null);
			fetchData();
			onRefresh?.();
		} catch {
			toast.error('Failed to delete event multiplier');
		}
	};

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	const columns: ColumnDef<EventMultiplier>[] = useMemo(
		() => [
			{
				accessorKey: 'event_name',
				header: 'Event Name',
				cell: ({ row }) => (
					<span className='font-medium'>{row.original.event_name}</span>
				),
			},
			{
				accessorKey: 'event_type',
				header: 'Event Type',
				cell: ({ row }) => (
					<Badge
						variant='outline'
						className={EVENT_TYPE_COLORS[row.original.event_type]}
					>
						{EVENT_TYPE_LABELS[row.original.event_type]}
					</Badge>
				),
			},
			{
				id: 'location',
				header: 'Location',
				cell: ({ row }) => (
					<span className='text-sm'>{getLocationLabel(row.original)}</span>
				),
			},
			{
				id: 'date_range',
				header: 'Date Range',
				cell: ({ row }) => (
					<span className='text-sm'>
						{formatDateRange(row.original.starts_at, row.original.ends_at)}
					</span>
				),
			},
			{
				id: 'buffer',
				header: 'Buffer',
				cell: ({ row }) => (
					<span className='text-sm'>
						{row.original.pre_event_minutes}m before, {row.original.post_event_minutes}m
						after
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
				id: 'status',
				header: 'Status',
				cell: ({ row }) => {
					const status = getEventStatus(row.original.starts_at, row.original.ends_at);
					return <Badge variant={status.variant}>{status.label}</Badge>;
				},
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
				<div>
					<p className='text-sm text-muted-foreground'>
						Event multipliers apply surge pricing around scheduled events (city/zone level).
					</p>
				</div>
				<Button onClick={handleOpenCreate}>
					<IconPlus className='mr-2 h-4 w-4' />
					Add Event
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
											No event multipliers found.
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
								of {pagination.total} events
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
				<DialogContent className='max-w-lg'>
					<DialogHeader>
						<DialogTitle>
							{editingItem ? 'Edit Event Multiplier' : 'Add Event Multiplier'}
						</DialogTitle>
						<DialogDescription>
							{editingItem
								? 'Update the event-based multiplier configuration.'
								: 'Create a new event-based pricing multiplier.'}
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='event_name'>Event Name</Label>
							<Input
								id='event_name'
								value={formData.event_name}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										event_name: e.target.value,
									}))
								}
								placeholder='e.g., Super Bowl LVIII'
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='event_type'>Event Type</Label>
							<Select
								value={formData.event_type}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										event_type: value as EventType,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder='Select event type' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='sports'>Sports</SelectItem>
									<SelectItem value='concert'>Concert</SelectItem>
									<SelectItem value='conference'>Conference</SelectItem>
									<SelectItem value='holiday'>Holiday</SelectItem>
									<SelectItem value='festival'>Festival</SelectItem>
									<SelectItem value='other'>Other</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='grid gap-2'>
								<Label htmlFor='starts_at'>Start Time</Label>
								<Input
									id='starts_at'
									type='datetime-local'
									value={formData.starts_at}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											starts_at: e.target.value,
										}))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='ends_at'>End Time</Label>
								<Input
									id='ends_at'
									type='datetime-local'
									value={formData.ends_at}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											ends_at: e.target.value,
										}))
									}
								/>
							</div>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='grid gap-2'>
								<Label htmlFor='pre_event_minutes'>
									Pre-Event Buffer (minutes)
								</Label>
								<Input
									id='pre_event_minutes'
									type='number'
									min={0}
									value={formData.pre_event_minutes}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											pre_event_minutes:
												parseInt(e.target.value, 10) || 0,
										}))
									}
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='post_event_minutes'>
									Post-Event Buffer (minutes)
								</Label>
								<Input
									id='post_event_minutes'
									type='number'
									min={0}
									value={formData.post_event_minutes}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											post_event_minutes:
												parseInt(e.target.value, 10) || 0,
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
								<Label htmlFor='expected_demand_increase'>
									Expected Demand Increase (%)
								</Label>
								<Input
									id='expected_demand_increase'
									type='number'
									min={0}
									value={formData.expected_demand_increase ?? ''}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											expected_demand_increase: e.target.value
												? parseFloat(e.target.value)
												: undefined,
										}))
									}
									placeholder='Optional'
								/>
							</div>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='grid gap-2'>
								<Label htmlFor='city_id'>City ID (optional)</Label>
								<Input
									id='city_id'
									value={formData.city_id ?? ''}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											city_id: e.target.value || undefined,
										}))
									}
									placeholder='Enter city ID'
								/>
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='zone_id'>Zone ID (optional)</Label>
								<Input
									id='zone_id'
									value={formData.zone_id ?? ''}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											zone_id: e.target.value || undefined,
										}))
									}
									placeholder='Enter zone ID'
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
						<AlertDialogTitle>Delete Event Multiplier</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this event multiplier? This action
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
