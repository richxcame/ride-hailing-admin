'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
	IconRefresh,
	IconX,
	IconUser,
	IconSteeringWheel,
	IconCurrencyDollar,
	IconReceiptOff,
	IconListDetails,
	IconChevronUp,
	IconChevronDown,
	IconDots,
	IconReceipt,
} from '@tabler/icons-react';
import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { supportService } from '@/lib/api/support.service';
import { CancellationRecord, CancellationStats } from '@/lib/types/support';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const formatMoney = (value: number): string => {
	return `$${value.toFixed(2)}`;
};

const getCancelledByBadge = (cancelledBy: string) => {
	switch (cancelledBy) {
		case 'rider':
			return (
				<Badge
					variant='secondary'
					className='bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
				>
					Rider
				</Badge>
			);
		case 'driver':
			return (
				<Badge
					variant='secondary'
					className='bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
				>
					Driver
				</Badge>
			);
		case 'system':
			return <Badge variant='secondary'>System</Badge>;
		default:
			return <Badge variant='secondary'>{cancelledBy}</Badge>;
	}
};

const getWaiverStatusBadge = (status?: string) => {
	if (!status)
		return <span className='text-sm text-muted-foreground'>-</span>;
	switch (status) {
		case 'approved':
			return (
				<Badge
					variant='secondary'
					className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
				>
					Approved
				</Badge>
			);
		case 'denied':
			return <Badge variant='destructive'>Denied</Badge>;
		case 'pending':
			return (
				<Badge
					variant='secondary'
					className='bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
				>
					Pending
				</Badge>
			);
		default:
			return <Badge variant='secondary'>{status}</Badge>;
	}
};

function ActionCell({
	record,
	onWaive,
}: {
	record: CancellationRecord;
	onWaive: (record: CancellationRecord) => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' className='h-8 w-8 p-0'>
					<span className='sr-only'>Open menu</span>
					<IconDots className='h-4 w-4' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuLabel>Actions</DropdownMenuLabel>
				{!record.fee_waived && record.cancellation_fee > 0 && (
					<DropdownMenuItem onSelect={() => onWaive(record)}>
						<IconReceiptOff className='mr-2 h-4 w-4' />
						Waive Fee
					</DropdownMenuItem>
				)}
				{(record.fee_waived || record.cancellation_fee === 0) && (
					<DropdownMenuItem disabled>
						<IconReceipt className='mr-2 h-4 w-4' />
						{record.fee_waived
							? 'Fee Already Waived'
							: 'No Fee to Waive'}
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const createColumns = (
	onWaive: (record: CancellationRecord) => void,
): ColumnDef<CancellationRecord>[] => [
	{
		accessorKey: 'ride_id',
		header: 'Ride ID',
		cell: ({ row }) => {
			const id = row.getValue('ride_id') as string;
			return (
				<div className='font-mono text-xs truncate max-w-25' title={id}>
					{id.substring(0, 8)}...
				</div>
			);
		},
	},
	{
		accessorKey: 'user_name',
		header: 'User',
		cell: ({ row }) => {
			const record = row.original;
			return (
				<div className='flex flex-col'>
					<span className='text-sm font-medium'>
						{record.user_name || 'Unknown User'}
					</span>
					<span className='text-xs text-muted-foreground font-mono'>
						{record.user_id.substring(0, 8)}...
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: 'cancelled_by',
		header: 'Cancelled By',
		cell: ({ row }) =>
			getCancelledByBadge(row.getValue('cancelled_by') as string),
	},
	{
		accessorKey: 'reason',
		header: 'Reason',
		cell: ({ row }) => {
			const reason = row.getValue('reason') as string;
			return (
				<div
					className='max-w-40 truncate text-sm text-muted-foreground'
					title={reason || 'No reason provided'}
				>
					{reason || '-'}
				</div>
			);
		},
	},
	{
		accessorKey: 'cancellation_fee',
		header: 'Fee',
		cell: ({ row }) => {
			const fee = row.getValue('cancellation_fee') as number;
			return (
				<span className='text-sm font-medium'>{formatMoney(fee)}</span>
			);
		},
	},
	{
		accessorKey: 'fee_waived',
		header: 'Waived',
		cell: ({ row }) => {
			const waived = row.getValue('fee_waived') as boolean;
			return waived ? (
				<Badge
					variant='secondary'
					className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
				>
					Yes
				</Badge>
			) : (
				<Badge variant='secondary'>No</Badge>
			);
		},
	},
	{
		accessorKey: 'waiver_status',
		header: 'Waiver Status',
		cell: ({ row }) =>
			getWaiverStatusBadge(
				row.getValue('waiver_status') as string | undefined,
			),
	},
	{
		accessorKey: 'created_at',
		header: 'Created',
		cell: ({ row }) => {
			const date = new Date(row.getValue('created_at') as string);
			return (
				<div className='text-sm text-muted-foreground'>
					{date.toLocaleDateString()} {date.toLocaleTimeString()}
				</div>
			);
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => (
			<ActionCell record={row.original} onWaive={onWaive} />
		),
	},
];

export default function CancellationsPage() {
	const [cancellations, setCancellations] = useState<CancellationRecord[]>(
		[],
	);
	const [isLoading, setIsLoading] = useState(true);
	const [stats, setStats] = useState<CancellationStats | null>(null);
	const [isLoadingStats, setIsLoadingStats] = useState(true);
	const [pagination, setPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});
	const [filters, setFilters] = useState({
		cancelled_by: '',
		fee_waived: '',
	});

	// Waive fee dialog state
	const [waiveDialogOpen, setWaiveDialogOpen] = useState(false);
	const [recordToWaive, setRecordToWaive] =
		useState<CancellationRecord | null>(null);
	const [waiverReason, setWaiverReason] = useState('');
	const [isWaiving, setIsWaiving] = useState(false);

	// Table state
	const [sorting, setSorting] = useState<SortingState>([]);

	const fetchCancellations = useCallback(async () => {
		try {
			setIsLoading(true);
			const params: Record<string, string | number | boolean> = {
				limit: pagination.limit,
				offset: pagination.offset,
			};

			if (filters.cancelled_by && filters.cancelled_by !== 'all') {
				params.cancelled_by = filters.cancelled_by;
			}
			if (filters.fee_waived && filters.fee_waived !== 'all') {
				params.fee_waived = filters.fee_waived === 'yes';
			}

			const response = await supportService.getCancellations(params);
			setCancellations(response.data);
			setPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to load cancellations';
			toast.error('Failed to load cancellations', {
				description: errorMessage,
			});
		} finally {
			setIsLoading(false);
		}
	}, [pagination.limit, pagination.offset, filters]);

	const fetchStats = useCallback(async () => {
		try {
			setIsLoadingStats(true);
			const statsData = await supportService.getCancellationStats();
			setStats(statsData);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to load cancellation stats';
			toast.error('Failed to load stats', { description: errorMessage });
		} finally {
			setIsLoadingStats(false);
		}
	}, []);

	useEffect(() => {
		fetchCancellations();
	}, [fetchCancellations]);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	const handleRefresh = () => {
		fetchCancellations();
		fetchStats();
		toast.success('Cancellations refreshed');
	};

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	const handleWaiveClick = (record: CancellationRecord) => {
		setRecordToWaive(record);
		setWaiverReason('');
		setWaiveDialogOpen(true);
	};

	const handleConfirmWaive = async () => {
		if (!recordToWaive || !waiverReason.trim()) {
			toast.error('Please provide a reason for waiving the fee');
			return;
		}

		try {
			setIsWaiving(true);
			await supportService.waiveCancellationFee(recordToWaive.id, {
				waiver_reason: waiverReason,
			});
			toast.success('Cancellation fee waived successfully', {
				description: `Fee of ${formatMoney(recordToWaive.cancellation_fee)} has been waived.`,
			});
			setWaiveDialogOpen(false);
			setRecordToWaive(null);
			setWaiverReason('');
			fetchCancellations();
			fetchStats();
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to waive cancellation fee';
			toast.error('Failed to waive fee', { description: errorMessage });
		} finally {
			setIsWaiving(false);
		}
	};

	const columns = useMemo(() => createColumns(handleWaiveClick), []);

	const table = useReactTable({
		data: cancellations,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		state: {
			sorting,
		},
	});

	const totalPages = Math.ceil(pagination.total / pagination.limit);
	const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>
						Cancellations
					</h1>
					<p className='text-sm text-muted-foreground'>
						Monitor ride cancellations and manage fee waivers
					</p>
				</div>
				<Button variant='outline' size='sm' onClick={handleRefresh}>
					<IconRefresh className='h-4 w-4' />
					Refresh
				</Button>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card className='border-l-4 border-l-red-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconX className='h-4 w-4' />
							Total Cancellations
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl'>
								{stats?.total_cancellations ?? 0}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						{isLoadingStats ? (
							<Skeleton className='h-4 w-32' />
						) : (
							<p className='text-xs text-muted-foreground'>
								Cancellation rate:{' '}
								<span className='font-medium text-red-600'>
									{(
										(stats?.cancellation_rate ?? 0) * 100
									).toFixed(1)}
									%
								</span>
							</p>
						)}
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-blue-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconUser className='h-4 w-4 text-blue-600' />
							Rider Cancellations
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-blue-600'>
								{stats?.rider_cancellations ?? 0}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						{isLoadingStats ? (
							<Skeleton className='h-4 w-32' />
						) : (
							<p className='text-xs text-muted-foreground'>
								{stats && stats.total_cancellations > 0
									? `${((stats.rider_cancellations / stats.total_cancellations) * 100).toFixed(1)}% of total`
									: '0% of total'}
							</p>
						)}
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-orange-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconSteeringWheel className='h-4 w-4 text-orange-600' />
							Driver Cancellations
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-orange-600'>
								{stats?.driver_cancellations ?? 0}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						{isLoadingStats ? (
							<Skeleton className='h-4 w-32' />
						) : (
							<p className='text-xs text-muted-foreground'>
								{stats && stats.total_cancellations > 0
									? `${((stats.driver_cancellations / stats.total_cancellations) * 100).toFixed(1)}% of total`
									: '0% of total'}
							</p>
						)}
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-green-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCurrencyDollar className='h-4 w-4 text-green-600' />
							Fees Collected
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-green-600'>
								{formatMoney(stats?.total_fees_collected ?? 0)}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						{isLoadingStats ? (
							<Skeleton className='h-4 w-32' />
						) : (
							<p className='text-xs text-muted-foreground'>
								Waived:{' '}
								<span className='font-medium text-orange-600'>
									{formatMoney(stats?.total_fees_waived ?? 0)}
								</span>
								{' | '}Avg:{' '}
								<span className='font-medium'>
									{formatMoney(stats?.avg_fee_amount ?? 0)}
								</span>
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Top Reasons Card */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2 text-base'>
						<IconListDetails className='h-4 w-4' />
						Top Cancellation Reasons
					</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoadingStats ? (
						<div className='space-y-2'>
							{[...Array(3)].map((_, i) => (
								<Skeleton key={i} className='h-8 w-full' />
							))}
						</div>
					) : stats?.top_reasons && stats.top_reasons.length > 0 ? (
						<div className='space-y-2'>
							{stats.top_reasons.map((item, index) => (
								<div
									key={index}
									className='flex items-center justify-between rounded-md border px-3 py-2'
								>
									<span className='text-sm'>
										{item.reason}
									</span>
									<Badge variant='secondary'>
										{item.count}
									</Badge>
								</div>
							))}
						</div>
					) : (
						<p className='text-sm text-muted-foreground'>
							No cancellation reasons recorded yet.
						</p>
					)}
				</CardContent>
			</Card>

			{/* Filters & Table */}
			<Card>
				<CardHeader>
					<CardTitle>Cancellation Records</CardTitle>
					<CardDescription>
						{isLoading
							? 'Loading cancellations...'
							: `Showing ${cancellations.length} of ${pagination.total} records`}
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					{/* Filters */}
					<div className='flex flex-col gap-4 md:flex-row md:items-center'>
						<div className='flex gap-2'>
							<div className='space-y-1'>
								<Label className='text-xs text-muted-foreground'>
									Cancelled By
								</Label>
								<Select
									value={filters.cancelled_by}
									onValueChange={(value) => {
										setFilters((prev) => ({
											...prev,
											cancelled_by: value,
										}));
										setPagination((prev) => ({
											...prev,
											offset: 0,
										}));
									}}
								>
									<SelectTrigger className='w-37.5'>
										<SelectValue placeholder='All' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>All</SelectItem>
										<SelectItem value='rider'>
											Rider
										</SelectItem>
										<SelectItem value='driver'>
											Driver
										</SelectItem>
										<SelectItem value='system'>
											System
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className='space-y-1'>
								<Label className='text-xs text-muted-foreground'>
									Fee Waived
								</Label>
								<Select
									value={filters.fee_waived}
									onValueChange={(value) => {
										setFilters((prev) => ({
											...prev,
											fee_waived: value,
										}));
										setPagination((prev) => ({
											...prev,
											offset: 0,
										}));
									}}
								>
									<SelectTrigger className='w-37.5'>
										<SelectValue placeholder='All' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all'>All</SelectItem>
										<SelectItem value='yes'>Yes</SelectItem>
										<SelectItem value='no'>No</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					{/* Table */}
					{isLoading ? (
						<div className='space-y-2'>
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className='h-16 w-full' />
							))}
						</div>
					) : cancellations.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-12 text-center'>
							<IconX className='h-12 w-12 text-muted-foreground mb-4' />
							<h3 className='text-lg font-semibold'>
								No cancellations found
							</h3>
							<p className='text-sm text-muted-foreground'>
								No records match your current filters.
							</p>
						</div>
					) : (
						<div className='space-y-4'>
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										{table
											.getHeaderGroups()
											.map((headerGroup) => (
												<TableRow key={headerGroup.id}>
													{headerGroup.headers.map(
														(header) => (
															<TableHead
																key={header.id}
															>
																{header.isPlaceholder ? null : (
																	<div
																		className={
																			header.column.getCanSort()
																				? 'flex items-center gap-2 cursor-pointer'
																				: ''
																		}
																		onClick={header.column.getToggleSortingHandler()}
																	>
																		{flexRender(
																			header
																				.column
																				.columnDef
																				.header,
																			header.getContext(),
																		)}
																		{header.column.getCanSort() && (
																			<div className='flex flex-col'>
																				<IconChevronUp className='h-3 w-3' />
																				<IconChevronDown className='h-3 w-3 -mt-1' />
																			</div>
																		)}
																	</div>
																)}
															</TableHead>
														),
													)}
												</TableRow>
											))}
									</TableHeader>
									<TableBody>
										{table.getRowModel().rows.map((row) => (
											<TableRow key={row.id}>
												{row
													.getVisibleCells()
													.map((cell) => (
														<TableCell
															key={cell.id}
														>
															{flexRender(
																cell.column
																	.columnDef
																	.cell,
																cell.getContext(),
															)}
														</TableCell>
													))}
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className='flex items-center justify-between'>
									<p className='text-sm text-muted-foreground'>
										Showing {pagination.offset + 1} to{' '}
										{Math.min(
											pagination.offset +
												pagination.limit,
											pagination.total,
										)}{' '}
										of {pagination.total} records
									</p>
									<div className='flex items-center gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												handlePageChange(
													pagination.offset -
														pagination.limit,
												)
											}
											disabled={currentPage === 1}
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
												handlePageChange(
													pagination.offset +
														pagination.limit,
												)
											}
											disabled={
												currentPage === totalPages
											}
										>
											Next
										</Button>
									</div>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Waive Fee Dialog */}
			<Dialog open={waiveDialogOpen} onOpenChange={setWaiveDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<IconReceiptOff className='h-5 w-5 text-orange-600' />
							Waive Cancellation Fee
						</DialogTitle>
						<DialogDescription>
							Are you sure you want to waive the cancellation fee
							of{' '}
							<span className='font-medium'>
								{recordToWaive
									? formatMoney(
											recordToWaive.cancellation_fee,
										)
									: '$0.00'}
							</span>
							?
							{recordToWaive && (
								<span className='block mt-2'>
									Ride ID:{' '}
									<span className='font-mono'>
										{recordToWaive.ride_id.substring(0, 12)}
										...
									</span>
									{recordToWaive.user_name && (
										<>
											{' '}
											| User:{' '}
											<span className='font-medium'>
												{recordToWaive.user_name}
											</span>
										</>
									)}
								</span>
							)}
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-2'>
						<Label htmlFor='waiver-reason'>
							Reason for waiving
						</Label>
						<Textarea
							id='waiver-reason'
							placeholder='Enter the reason for waiving this cancellation fee...'
							value={waiverReason}
							onChange={(e) => setWaiverReason(e.target.value)}
							rows={3}
						/>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setWaiveDialogOpen(false)}
							disabled={isWaiving}
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmWaive}
							disabled={isWaiving || !waiverReason.trim()}
							className='bg-orange-600 text-white hover:bg-orange-700'
						>
							{isWaiving ? 'Waiving...' : 'Waive Fee'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
