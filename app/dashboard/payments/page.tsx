'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import {
	IconRefresh,
	IconSearch,
	IconCurrencyDollar,
	IconReceipt,
	IconPercentage,
	IconAlertTriangle,
	IconEye,
	IconArrowBackUp,
	IconChevronUp,
	IconChevronDown,
	IconCreditCard,
	IconWallet,
	IconCash,
	IconCopy,
} from '@tabler/icons-react';
import { paymentsService } from '@/lib/api/payments.service';
import {
	Transaction,
	TransactionStatus,
	TransactionMethod,
	PaymentStats,
	RefundRequest,
} from '@/lib/types/payments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
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
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';

// Currency formatter
const formatCurrency = (value: number) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(value);
};

// Date formatter
const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return {
		date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
		time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
	};
};

// Status badge config
const getStatusBadge = (status: TransactionStatus) => {
	const config: Record<TransactionStatus, { label: string; className: string }> = {
		pending: {
			label: 'Pending',
			className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
		},
		completed: {
			label: 'Completed',
			className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
		},
		failed: {
			label: 'Failed',
			className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
		},
		refunded: {
			label: 'Refunded',
			className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
		},
		partially_refunded: {
			label: 'Partial Refund',
			className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
		},
	};
	return config[status] || { label: status, className: '' };
};

// Method badge config
const getMethodBadge = (method: TransactionMethod) => {
	const config: Record<TransactionMethod, { label: string; className: string; icon: typeof IconCreditCard }> = {
		card: {
			label: 'Card',
			className: '',
			icon: IconCreditCard,
		},
		wallet: {
			label: 'Wallet',
			className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
			icon: IconWallet,
		},
		cash: {
			label: 'Cash',
			className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
			icon: IconCash,
		},
	};
	return config[method] || { label: method, className: '', icon: IconCreditCard };
};

// Column definitions
const createColumns = (): ColumnDef<Transaction>[] => [
	{
		accessorKey: 'id',
		header: 'ID',
		cell: ({ row }) => {
			const id = row.getValue('id') as string;
			return (
				<span className='font-mono text-xs'>
					{id.substring(0, 8)}...
				</span>
			);
		},
	},
	{
		accessorKey: 'ride_id',
		header: 'Ride ID',
		cell: ({ row }) => {
			const rideId = row.getValue('ride_id') as string;
			return (
				<span className='font-mono text-xs'>
					{rideId.substring(0, 8)}...
				</span>
			);
		},
	},
	{
		accessorKey: 'rider_name',
		header: 'Rider',
		cell: ({ row }) => {
			const name = row.original.rider_name;
			return (
				<span className='text-sm font-medium'>
					{name || 'N/A'}
				</span>
			);
		},
	},
	{
		accessorKey: 'driver_name',
		header: 'Driver',
		cell: ({ row }) => {
			const name = row.original.driver_name;
			return (
				<span className='text-sm font-medium'>
					{name || 'N/A'}
				</span>
			);
		},
	},
	{
		accessorKey: 'amount',
		header: ({ column }) => {
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Amount
					{column.getIsSorted() === 'asc' ? (
						<IconChevronUp className='ml-2 h-4 w-4' />
					) : column.getIsSorted() === 'desc' ? (
						<IconChevronDown className='ml-2 h-4 w-4' />
					) : null}
				</Button>
			);
		},
		cell: ({ row }) => {
			return (
				<span className='font-medium'>
					{formatCurrency(row.original.amount)}
				</span>
			);
		},
	},
	{
		accessorKey: 'commission',
		header: 'Commission',
		cell: ({ row }) => {
			return (
				<span className='text-sm text-muted-foreground'>
					{formatCurrency(row.original.commission)}
				</span>
			);
		},
	},
	{
		accessorKey: 'method',
		header: 'Method',
		cell: ({ row }) => {
			const method = row.original.method;
			const config = getMethodBadge(method);
			const MethodIcon = config.icon;
			return (
				<Badge variant='outline' className={config.className}>
					<MethodIcon className='h-3 w-3' />
					{config.label}
				</Badge>
			);
		},
	},
	{
		accessorKey: 'status',
		header: ({ column }) => {
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Status
					{column.getIsSorted() === 'asc' ? (
						<IconChevronUp className='ml-2 h-4 w-4' />
					) : column.getIsSorted() === 'desc' ? (
						<IconChevronDown className='ml-2 h-4 w-4' />
					) : null}
				</Button>
			);
		},
		cell: ({ row }) => {
			const status = row.original.status;
			const config = getStatusBadge(status);
			return (
				<Badge variant='outline' className={config.className}>
					{config.label}
				</Badge>
			);
		},
	},
	{
		accessorKey: 'created_at',
		header: ({ column }) => {
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Created
					{column.getIsSorted() === 'asc' ? (
						<IconChevronUp className='ml-2 h-4 w-4' />
					) : column.getIsSorted() === 'desc' ? (
						<IconChevronDown className='ml-2 h-4 w-4' />
					) : null}
				</Button>
			);
		},
		cell: ({ row }) => {
			const { date, time } = formatDate(row.original.created_at);
			return (
				<div className='flex flex-col text-xs'>
					<span>{date}</span>
					<span className='text-muted-foreground'>{time}</span>
				</div>
			);
		},
	},
	{
		id: 'actions',
		cell: () => null, // Placeholder - overridden in table render
	},
];

const columns = createColumns();

export default function PaymentsPage() {
	// Data state
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [stats, setStats] = useState<PaymentStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingStats, setIsLoadingStats] = useState(true);

	// Pagination state
	const [pagination, setPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});

	// Filter state
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [methodFilter, setMethodFilter] = useState<string>('all');
	const [searchQuery, setSearchQuery] = useState('');

	// Table sorting state
	const [sorting, setSorting] = useState<SortingState>([]);

	// Detail sheet state
	const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
	const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

	// Refund dialog state
	const [refundDialogOpen, setRefundDialogOpen] = useState(false);
	const [transactionToRefund, setTransactionToRefund] = useState<Transaction | null>(null);
	const [refundAmount, setRefundAmount] = useState('');
	const [refundReason, setRefundReason] = useState('');
	const [isRefunding, setIsRefunding] = useState(false);

	// Fetch transactions
	const fetchTransactions = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await paymentsService.getTransactions({
				limit: pagination.limit,
				offset: pagination.offset,
				...(statusFilter !== 'all' && { status: statusFilter }),
				...(methodFilter !== 'all' && { method: methodFilter }),
				...(searchQuery && { search: searchQuery }),
			});
			setTransactions(response.data);
			setPagination((prev) => ({ ...prev, total: response.meta.total }));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load transactions';
			toast.error('Failed to load transactions', { description: errorMessage });
		} finally {
			setIsLoading(false);
		}
	}, [pagination.limit, pagination.offset, statusFilter, methodFilter, searchQuery]);

	// Fetch stats
	const fetchStats = useCallback(async () => {
		try {
			setIsLoadingStats(true);
			const paymentStats = await paymentsService.getStats();
			setStats(paymentStats);
		} catch (error) {
			console.error('Failed to fetch payment stats:', error);
		} finally {
			setIsLoadingStats(false);
		}
	}, []);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	useEffect(() => {
		fetchTransactions();
	}, [pagination.offset, pagination.limit, statusFilter, methodFilter]);

	// Handlers
	const handleSearch = () => {
		setPagination((prev) => ({ ...prev, offset: 0 }));
		fetchTransactions();
	};

	const handleRefresh = () => {
		fetchTransactions();
		fetchStats();
		toast.success('Payments refreshed');
	};

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	// View transaction details
	const handleViewTransaction = async (transactionId: string) => {
		try {
			const transaction = await paymentsService.getTransaction(transactionId);
			setSelectedTransaction(transaction);
			setIsDetailSheetOpen(true);
		} catch (error) {
			toast.error('Failed to load transaction details');
		}
	};

	// Open refund dialog
	const handleRefundClick = (transaction: Transaction) => {
		setTransactionToRefund(transaction);
		setRefundAmount('');
		setRefundReason('');
		setRefundDialogOpen(true);
	};

	// Confirm refund
	const handleConfirmRefund = async () => {
		if (!transactionToRefund || !refundReason.trim()) {
			toast.error('Please provide a reason for the refund');
			return;
		}

		try {
			setIsRefunding(true);
			const data: RefundRequest = {
				reason: refundReason,
			};
			if (refundAmount && parseFloat(refundAmount) > 0) {
				data.amount = parseFloat(refundAmount);
			}
			await paymentsService.refund(transactionToRefund.id, data);
			toast.success('Refund processed successfully', {
				description: `Transaction ${transactionToRefund.id.substring(0, 8)}... has been refunded.`,
			});
			setRefundDialogOpen(false);
			setTransactionToRefund(null);
			setRefundAmount('');
			setRefundReason('');
			fetchTransactions();
			fetchStats();

			// Update detail sheet if open
			if (selectedTransaction?.id === transactionToRefund.id) {
				setIsDetailSheetOpen(false);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to process refund';
			toast.error('Failed to process refund', { description: errorMessage });
		} finally {
			setIsRefunding(false);
		}
	};

	// Table setup
	const table = useReactTable({
		data: transactions,
		columns,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
		},
	});

	// Pagination values
	const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
	const totalPages = Math.ceil(pagination.total / pagination.limit);

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Payments</h1>
					<p className='text-sm text-muted-foreground'>
						Monitor transactions, process refunds, and review payment activity
					</p>
				</div>
				<Button variant='outline' size='sm' onClick={handleRefresh}>
					<IconRefresh className='h-4 w-4' />
					Refresh
				</Button>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card className='border-l-4 border-l-blue-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconReceipt className='h-4 w-4' />
							Total Transactions
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl'>
								{(stats?.total_transactions ?? 0).toLocaleString()}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							{stats?.completed_transactions ?? 0} completed
						</p>
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-green-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCurrencyDollar className='h-4 w-4' />
							Total Amount
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-24' />
						) : (
							<CardTitle className='text-3xl'>
								{formatCurrency(stats?.total_amount ?? 0)}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							Avg: {formatCurrency(stats?.avg_transaction_amount ?? 0)}
						</p>
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-purple-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconPercentage className='h-4 w-4' />
							Commission Earned
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-24' />
						) : (
							<CardTitle className='text-3xl'>
								{formatCurrency(stats?.total_commission ?? 0)}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							Driver earnings: {formatCurrency(stats?.total_driver_earnings ?? 0)}
						</p>
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-red-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconAlertTriangle className='h-4 w-4' />
							Failed / Refunded
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl'>
								{((stats?.failed_transactions ?? 0) + (stats?.refunded_transactions ?? 0)).toLocaleString()}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							{stats?.failed_transactions ?? 0} failed, {stats?.refunded_transactions ?? 0} refunded
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Payment Methods Breakdown */}
			{stats && stats.by_method && stats.by_method.length > 0 && (
				<Card>
					<CardHeader className='pb-3'>
						<CardTitle className='text-base'>Payment Methods Breakdown</CardTitle>
						<CardDescription>Transaction volume by payment method</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='flex flex-wrap gap-6'>
							{stats.by_method.map((entry) => {
								const config = getMethodBadge(entry.method);
								const MethodIcon = config.icon;
								return (
									<div key={entry.method} className='flex items-center gap-3'>
										<div className='flex h-10 w-10 items-center justify-center rounded-lg bg-muted'>
											<MethodIcon className='h-5 w-5 text-muted-foreground' />
										</div>
										<div>
											<p className='text-sm font-medium capitalize'>{entry.method}</p>
											<div className='flex items-center gap-2 text-xs text-muted-foreground'>
												<span>{entry.count.toLocaleString()} txns</span>
												<span>&middot;</span>
												<span>{formatCurrency(entry.amount)}</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Filters & Table */}
			<Card>
				<CardHeader>
					<CardTitle>Transactions</CardTitle>
					<CardDescription>
						Browse and manage all payment transactions
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					{/* Filters */}
					<div className='flex flex-col gap-4 md:flex-row md:items-center'>
						<div className='flex-1'>
							<div className='relative'>
								<IconSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
								<Input
									placeholder='Search by transaction ID, ride ID, or name...'
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											handleSearch();
										}
									}}
									className='pl-9 max-w-md'
								/>
							</div>
						</div>
						<div className='flex gap-2'>
							<Select value={statusFilter} onValueChange={(value) => {
								setStatusFilter(value);
								setPagination((prev) => ({ ...prev, offset: 0 }));
							}}>
								<SelectTrigger className='w-[170px]'>
									<SelectValue placeholder='Status' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Status</SelectItem>
									<SelectItem value='pending'>Pending</SelectItem>
									<SelectItem value='completed'>Completed</SelectItem>
									<SelectItem value='failed'>Failed</SelectItem>
									<SelectItem value='refunded'>Refunded</SelectItem>
									<SelectItem value='partially_refunded'>Partially Refunded</SelectItem>
								</SelectContent>
							</Select>
							<Select value={methodFilter} onValueChange={(value) => {
								setMethodFilter(value);
								setPagination((prev) => ({ ...prev, offset: 0 }));
							}}>
								<SelectTrigger className='w-[130px]'>
									<SelectValue placeholder='Method' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Methods</SelectItem>
									<SelectItem value='card'>Card</SelectItem>
									<SelectItem value='wallet'>Wallet</SelectItem>
									<SelectItem value='cash'>Cash</SelectItem>
								</SelectContent>
							</Select>
							<Button onClick={handleSearch}>Search</Button>
						</div>
					</div>

					{/* Table */}
					{isLoading ? (
						<div className='space-y-3'>
							{[...Array(5)].map((_, i) => (
								<div key={i} className='flex items-center gap-4'>
									<Skeleton className='h-10 w-full' />
								</div>
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
															{cell.column.id === 'actions' ? (
																<div className='flex items-center gap-1'>
																	<Button
																		variant='ghost'
																		size='sm'
																		onClick={() => handleViewTransaction(row.original.id)}
																		className='h-8 w-8 p-0'
																	>
																		<IconEye className='h-4 w-4' />
																		<span className='sr-only'>View details</span>
																	</Button>
																	{row.original.status === 'completed' && (
																		<Button
																			variant='ghost'
																			size='sm'
																			onClick={() => handleRefundClick(row.original)}
																			className='h-8 w-8 p-0 text-orange-600 hover:text-orange-700'
																		>
																			<IconArrowBackUp className='h-4 w-4' />
																			<span className='sr-only'>Refund</span>
																		</Button>
																	)}
																</div>
															) : (
																flexRender(
																	cell.column.columnDef.cell,
																	cell.getContext(),
																)
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
													No transactions found.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							<div className='flex items-center justify-between'>
								<div className='text-sm text-muted-foreground'>
									Showing {pagination.total === 0 ? 0 : pagination.offset + 1} to{' '}
									{Math.min(
										pagination.offset + pagination.limit,
										pagination.total,
									)}{' '}
									of {pagination.total} transactions
								</div>
								<div className='flex gap-2'>
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
									<div className='flex items-center gap-1'>
										<span className='text-sm'>
											Page {currentPage} of {totalPages || 1}
										</span>
									</div>
									<Button
										variant='outline'
										size='sm'
										onClick={() =>
											handlePageChange(pagination.offset + pagination.limit)
										}
										disabled={
											pagination.offset + pagination.limit >= pagination.total
										}
									>
										Next
									</Button>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Transaction Detail Sheet */}
			<Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
				<SheetContent className='w-full overflow-y-auto sm:max-w-lg'>
					<SheetHeader>
						<SheetTitle>Transaction Details</SheetTitle>
						<SheetDescription>
							Full details for this payment transaction
						</SheetDescription>
					</SheetHeader>
					{selectedTransaction && (
						<div className='space-y-6 py-6'>
							{/* Status & Method */}
							<div className='flex items-center gap-3'>
								{(() => {
									const statusConfig = getStatusBadge(selectedTransaction.status);
									return (
										<Badge variant='outline' className={statusConfig.className}>
											{statusConfig.label}
										</Badge>
									);
								})()}
								{(() => {
									const methodConfig = getMethodBadge(selectedTransaction.method);
									const MethodIcon = methodConfig.icon;
									return (
										<Badge variant='outline' className={methodConfig.className}>
											<MethodIcon className='h-3 w-3' />
											{methodConfig.label}
										</Badge>
									);
								})()}
							</div>

							{/* Amount Breakdown */}
							<div className='rounded-lg border p-4 space-y-3'>
								<h4 className='text-sm font-semibold'>Amount Breakdown</h4>
								<div className='space-y-2'>
									<div className='flex items-center justify-between'>
										<span className='text-sm text-muted-foreground'>Total Amount</span>
										<span className='text-lg font-bold'>{formatCurrency(selectedTransaction.amount)}</span>
									</div>
									<div className='flex items-center justify-between'>
										<span className='text-sm text-muted-foreground'>Commission</span>
										<span className='text-sm font-medium'>{formatCurrency(selectedTransaction.commission)}</span>
									</div>
									<div className='flex items-center justify-between'>
										<span className='text-sm text-muted-foreground'>Driver Earnings</span>
										<span className='text-sm font-medium'>{formatCurrency(selectedTransaction.driver_earnings)}</span>
									</div>
									{selectedTransaction.refund_amount != null && selectedTransaction.refund_amount > 0 && (
										<div className='flex items-center justify-between border-t pt-2'>
											<span className='text-sm text-orange-600'>Refund Amount</span>
											<span className='text-sm font-medium text-orange-600'>
												{formatCurrency(selectedTransaction.refund_amount)}
											</span>
										</div>
									)}
								</div>
							</div>

							{/* IDs & References */}
							<div className='rounded-lg border p-4 space-y-3'>
								<h4 className='text-sm font-semibold'>IDs & References</h4>
								<div className='space-y-2'>
									<DetailRow label='Transaction ID' value={selectedTransaction.id} mono copyable />
									<DetailRow label='Ride ID' value={selectedTransaction.ride_id} mono copyable />
									<DetailRow label='Rider ID' value={selectedTransaction.rider_id} mono copyable />
									<DetailRow label='Driver ID' value={selectedTransaction.driver_id} mono copyable />
									{selectedTransaction.transaction_ref && (
										<DetailRow label='Transaction Ref' value={selectedTransaction.transaction_ref} mono copyable />
									)}
								</div>
							</div>

							{/* Stripe Details */}
							{(selectedTransaction.stripe_payment_id || selectedTransaction.stripe_charge_id) && (
								<div className='rounded-lg border p-4 space-y-3'>
									<h4 className='text-sm font-semibold'>Stripe Details</h4>
									<div className='space-y-2'>
										{selectedTransaction.stripe_payment_id && (
											<DetailRow label='Payment ID' value={selectedTransaction.stripe_payment_id} mono copyable />
										)}
										{selectedTransaction.stripe_charge_id && (
											<DetailRow label='Charge ID' value={selectedTransaction.stripe_charge_id} mono copyable />
										)}
									</div>
								</div>
							)}

							{/* People */}
							<div className='rounded-lg border p-4 space-y-3'>
								<h4 className='text-sm font-semibold'>People</h4>
								<div className='space-y-2'>
									<DetailRow label='Rider' value={selectedTransaction.rider_name || 'N/A'} />
									<DetailRow label='Driver' value={selectedTransaction.driver_name || 'N/A'} />
								</div>
							</div>

							{/* Failure Reason */}
							{selectedTransaction.failure_reason && (
								<div className='rounded-lg border border-red-200 bg-red-50 p-4 space-y-2 dark:border-red-900 dark:bg-red-950'>
									<h4 className='text-sm font-semibold text-red-800 dark:text-red-300'>Failure Reason</h4>
									<p className='text-sm text-red-700 dark:text-red-400'>
										{selectedTransaction.failure_reason}
									</p>
								</div>
							)}

							{/* Refund Info */}
							{selectedTransaction.refunded_at && (
								<div className='rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-2 dark:border-orange-900 dark:bg-orange-950'>
									<h4 className='text-sm font-semibold text-orange-800 dark:text-orange-300'>Refund Information</h4>
									<div className='space-y-1'>
										<p className='text-sm text-orange-700 dark:text-orange-400'>
											Amount: {formatCurrency(selectedTransaction.refund_amount ?? 0)}
										</p>
										<p className='text-sm text-orange-700 dark:text-orange-400'>
											Refunded at: {formatDate(selectedTransaction.refunded_at).date} {formatDate(selectedTransaction.refunded_at).time}
										</p>
									</div>
								</div>
							)}

							{/* Timestamps */}
							<div className='rounded-lg border p-4 space-y-3'>
								<h4 className='text-sm font-semibold'>Timestamps</h4>
								<div className='space-y-2'>
									<DetailRow
										label='Created'
										value={`${formatDate(selectedTransaction.created_at).date} ${formatDate(selectedTransaction.created_at).time}`}
									/>
									<DetailRow
										label='Updated'
										value={`${formatDate(selectedTransaction.updated_at).date} ${formatDate(selectedTransaction.updated_at).time}`}
									/>
								</div>
							</div>

							{/* Actions */}
							{selectedTransaction.status === 'completed' && (
								<div className='pt-2'>
									<Button
										variant='outline'
										className='w-full text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700'
										onClick={() => {
											setIsDetailSheetOpen(false);
											handleRefundClick(selectedTransaction);
										}}
									>
										<IconArrowBackUp className='h-4 w-4' />
										Process Refund
									</Button>
								</div>
							)}
						</div>
					)}
				</SheetContent>
			</Sheet>

			{/* Refund Dialog */}
			<Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<IconArrowBackUp className='h-5 w-5 text-orange-600' />
							Process Refund
						</DialogTitle>
						<DialogDescription>
							Process a refund for transaction{' '}
							<span className='font-mono font-medium'>
								{transactionToRefund?.id.substring(0, 8)}...
							</span>
							{' '}({formatCurrency(transactionToRefund?.amount ?? 0)})
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<Label htmlFor='refund-amount'>
								Refund Amount (optional, leave empty for full refund)
							</Label>
							<Input
								id='refund-amount'
								type='number'
								step='0.01'
								min='0.01'
								max={transactionToRefund?.amount}
								placeholder={`Full amount: ${formatCurrency(transactionToRefund?.amount ?? 0)}`}
								value={refundAmount}
								onChange={(e) => setRefundAmount(e.target.value)}
							/>
							<p className='text-xs text-muted-foreground'>
								Maximum refund: {formatCurrency(transactionToRefund?.amount ?? 0)}
							</p>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='refund-reason'>Reason for refund</Label>
							<Textarea
								id='refund-reason'
								placeholder='Enter the reason for this refund...'
								value={refundReason}
								onChange={(e) => setRefundReason(e.target.value)}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setRefundDialogOpen(false)}
							disabled={isRefunding}
						>
							Cancel
						</Button>
						<Button
							onClick={handleConfirmRefund}
							disabled={isRefunding || !refundReason.trim()}
							className='bg-orange-600 text-white hover:bg-orange-700'
						>
							{isRefunding ? 'Processing...' : 'Confirm Refund'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// Helper component for detail rows in the sheet
function DetailRow({
	label,
	value,
	mono = false,
	copyable = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
	copyable?: boolean;
}) {
	const handleCopy = () => {
		navigator.clipboard.writeText(value);
		toast.success('Copied to clipboard');
	};

	return (
		<div className='flex items-center justify-between gap-2'>
			<span className='text-sm text-muted-foreground shrink-0'>{label}</span>
			<div className='flex items-center gap-1 min-w-0'>
				<span
					className={`text-sm truncate ${mono ? 'font-mono text-xs' : ''}`}
					title={value}
				>
					{value}
				</span>
				{copyable && (
					<Button
						variant='ghost'
						size='sm'
						className='h-6 w-6 p-0 shrink-0'
						onClick={handleCopy}
					>
						<IconCopy className='h-3 w-3' />
						<span className='sr-only'>Copy</span>
					</Button>
				)}
			</div>
		</div>
	);
}
