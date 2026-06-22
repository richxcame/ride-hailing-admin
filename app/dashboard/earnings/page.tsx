'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
	IconCurrencyDollar,
	IconReceipt,
	IconClock,
	IconAlertTriangle,
	IconCash,
	IconWallet,
	IconBuildingBank,
	IconDeviceMobile,
	IconCheck,
	IconX,
	IconPlayerPause,
	IconPlayerPlay,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { earningsService } from '@/lib/api/earnings.service';
import {
	DriverEarningsSummary,
	Payout,
	EarningsStats,
	PayoutStatus,
	PayoutMethod,
} from '@/lib/types/earnings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

// ==================== Helpers ====================

const formatMoney = (value: number, currency = 'USD'): string => {
	try {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency || 'USD',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(value);
	} catch {
		// Intl throws on unknown codes — fall back to a readable "TMT 50.00".
		return `${currency} ${value.toFixed(2)}`;
	}
};

const formatDate = (dateStr?: string): string => {
	if (!dateStr) return '-';
	return new Date(dateStr).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const getStatusBadge = (status: PayoutStatus) => {
	const map: Record<PayoutStatus, { label: string; className: string }> = {
		pending: {
			label: 'Pending',
			className:
				'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
		},
		processing: {
			label: 'Processing',
			className:
				'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
		},
		completed: {
			label: 'Completed',
			className:
				'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
		},
		failed: { label: 'Failed', className: '' },
		on_hold: {
			label: 'On Hold',
			className:
				'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
		},
	};
	const info = map[status];
	if (status === 'failed') {
		return <Badge variant='destructive'>{info.label}</Badge>;
	}
	return (
		<Badge variant='outline' className={info.className}>
			{info.label}
		</Badge>
	);
};

const getMethodBadge = (method: PayoutMethod) => {
	const map: Record<PayoutMethod, { label: string; className: string }> = {
		bank_transfer: { label: 'Bank Transfer', className: '' },
		mobile_money: {
			label: 'Mobile Money',
			className:
				'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
		},
		wallet: {
			label: 'Wallet',
			className:
				'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
		},
	};
	const info = map[method];
	if (method === 'bank_transfer') {
		return <Badge variant='outline'>{info.label}</Badge>;
	}
	return (
		<Badge variant='outline' className={info.className}>
			{info.label}
		</Badge>
	);
};

// ==================== Page Component ====================

export default function EarningsPage() {
	const [activeTab, setActiveTab] = useState('driver-earnings');

	// ==================== Stats ====================
	const [stats, setStats] = useState<EarningsStats | null>(null);
	const [isLoadingStats, setIsLoadingStats] = useState(true);

	// ==================== Driver Earnings State ====================
	const [driverEarnings, setDriverEarnings] = useState<
		DriverEarningsSummary[]
	>([]);
	const [isLoadingEarnings, setIsLoadingEarnings] = useState(true);
	const [earningsSorting, setEarningsSorting] = useState<SortingState>([]);
	const [earningsPagination, setEarningsPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});

	// ==================== Payouts State ====================
	const [payouts, setPayouts] = useState<Payout[]>([]);
	const [isLoadingPayouts, setIsLoadingPayouts] = useState(true);
	const [payoutsSorting, setPayoutsSorting] = useState<SortingState>([]);
	const [payoutsPagination, setPayoutsPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});
	const [payoutFilters, setPayoutFilters] = useState({
		status: 'all',
		method: 'all',
	});

	// ==================== Create Payout Dialog ====================
	const [createPayoutOpen, setCreatePayoutOpen] = useState(false);
	const [createPayoutData, setCreatePayoutData] = useState({
		driver_id: '',
		driver_name: '',
		amount: '',
		method: 'bank_transfer' as PayoutMethod,
		notes: '',
	});
	const [isCreatingPayout, setIsCreatingPayout] = useState(false);

	// ==================== Process Payout Dialog ====================
	const [processDialogOpen, setProcessDialogOpen] = useState(false);
	const [payoutToProcess, setPayoutToProcess] = useState<Payout | null>(null);
	const [processData, setProcessData] = useState({
		reference: '',
		notes: '',
	});
	const [isProcessing, setIsProcessing] = useState(false);

	// ==================== Complete Payout Dialog ====================
	const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
	const [payoutToComplete, setPayoutToComplete] = useState<Payout | null>(
		null,
	);
	const [completeData, setCompleteData] = useState({ reference: '' });
	const [isCompleting, setIsCompleting] = useState(false);

	// ==================== Fail Payout Dialog ====================
	const [failDialogOpen, setFailDialogOpen] = useState(false);
	const [payoutToFail, setPayoutToFail] = useState<Payout | null>(null);
	const [failData, setFailData] = useState({ reason: '' });
	const [isFailing, setIsFailing] = useState(false);

	// ==================== Hold Payout Dialog ====================
	const [holdDialogOpen, setHoldDialogOpen] = useState(false);
	const [payoutToHold, setPayoutToHold] = useState<Payout | null>(null);
	const [holdData, setHoldData] = useState({ notes: '' });
	const [isHolding, setIsHolding] = useState(false);

	// ==================== Data Fetching ====================

	const fetchStats = useCallback(async () => {
		try {
			setIsLoadingStats(true);
			const response = await earningsService.getStats();
			setStats(response);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to load earnings stats';
			toast.error('Failed to load earnings stats', {
				description: errorMessage,
			});
		} finally {
			setIsLoadingStats(false);
		}
	}, []);

	const fetchDriverEarnings = useCallback(async () => {
		try {
			setIsLoadingEarnings(true);
			const response = await earningsService.getDriverEarnings({
				limit: earningsPagination.limit,
				offset: earningsPagination.offset,
			});
			setDriverEarnings(response.data);
			setEarningsPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to load driver earnings';
			toast.error('Failed to load driver earnings', {
				description: errorMessage,
			});
		} finally {
			setIsLoadingEarnings(false);
		}
	}, [earningsPagination.limit, earningsPagination.offset]);

	const fetchPayouts = useCallback(async () => {
		try {
			setIsLoadingPayouts(true);
			const params: Record<string, string | number> = {
				limit: payoutsPagination.limit,
				offset: payoutsPagination.offset,
			};
			if (payoutFilters.status && payoutFilters.status !== 'all') {
				params.status = payoutFilters.status;
			}
			if (payoutFilters.method && payoutFilters.method !== 'all') {
				params.method = payoutFilters.method;
			}
			const response = await earningsService.getPayouts(params);
			setPayouts(response.data);
			setPayoutsPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to load payouts';
			toast.error('Failed to load payouts', {
				description: errorMessage,
			});
		} finally {
			setIsLoadingPayouts(false);
		}
	}, [payoutsPagination.limit, payoutsPagination.offset, payoutFilters]);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	useEffect(() => {
		fetchDriverEarnings();
	}, [fetchDriverEarnings]);

	useEffect(() => {
		fetchPayouts();
	}, [fetchPayouts]);

	const handleRefresh = () => {
		fetchStats();
		if (activeTab === 'driver-earnings') {
			fetchDriverEarnings();
		} else {
			fetchPayouts();
		}
		toast.success('Data refreshed');
	};

	// ==================== Create Payout ====================

	const handleOpenCreatePayout = (driver: DriverEarningsSummary) => {
		setCreatePayoutData({
			driver_id: driver.driver_id,
			driver_name: driver.driver_name,
			amount: driver.pending_payout.toFixed(2),
			method: 'bank_transfer',
			notes: '',
		});
		setCreatePayoutOpen(true);
	};

	const handleCreatePayout = async () => {
		const amount = parseFloat(createPayoutData.amount);
		if (!amount || amount <= 0) {
			toast.error('Please enter a valid amount');
			return;
		}
		setIsCreatingPayout(true);
		try {
			await earningsService.createPayout({
				driver_id: createPayoutData.driver_id,
				amount,
				method: createPayoutData.method,
				notes: createPayoutData.notes || undefined,
			});
			toast.success('Payout created successfully', {
				description: `${formatMoney(amount)} payout created for ${createPayoutData.driver_name}`,
			});
			setCreatePayoutOpen(false);
			fetchDriverEarnings();
			fetchPayouts();
			fetchStats();
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to create payout';
			toast.error('Failed to create payout', {
				description: errorMessage,
			});
		} finally {
			setIsCreatingPayout(false);
		}
	};

	// ==================== Process Payout ====================

	const handleOpenProcess = (payout: Payout) => {
		setPayoutToProcess(payout);
		setProcessData({ reference: '', notes: '' });
		setProcessDialogOpen(true);
	};

	const handleProcessPayout = async () => {
		if (!payoutToProcess) return;
		setIsProcessing(true);
		try {
			await earningsService.processPayout(payoutToProcess.id, {
				reference: processData.reference || undefined,
				notes: processData.notes || undefined,
			});
			toast.success('Payout is now processing', {
				description: `${formatMoney(payoutToProcess.amount, payoutToProcess.currency)} for ${payoutToProcess.driver_name || 'driver'}`,
			});
			setProcessDialogOpen(false);
			setPayoutToProcess(null);
			fetchPayouts();
			fetchStats();
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to process payout';
			toast.error('Failed to process payout', {
				description: errorMessage,
			});
		} finally {
			setIsProcessing(false);
		}
	};

	// ==================== Complete Payout ====================

	const handleOpenComplete = (payout: Payout) => {
		setPayoutToComplete(payout);
		setCompleteData({ reference: payout.reference || '' });
		setCompleteDialogOpen(true);
	};

	const handleCompletePayout = async () => {
		if (!payoutToComplete) return;
		setIsCompleting(true);
		try {
			await earningsService.completePayout(payoutToComplete.id, {
				reference: completeData.reference || undefined,
			});
			toast.success('Payout completed', {
				description: `${formatMoney(payoutToComplete.amount, payoutToComplete.currency)} for ${payoutToComplete.driver_name || 'driver'}`,
			});
			setCompleteDialogOpen(false);
			setPayoutToComplete(null);
			fetchPayouts();
			fetchDriverEarnings();
			fetchStats();
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to complete payout';
			toast.error('Failed to complete payout', {
				description: errorMessage,
			});
		} finally {
			setIsCompleting(false);
		}
	};

	// ==================== Fail Payout ====================

	const handleOpenFail = (payout: Payout) => {
		setPayoutToFail(payout);
		setFailData({ reason: '' });
		setFailDialogOpen(true);
	};

	const handleFailPayout = async () => {
		if (!payoutToFail || !failData.reason.trim()) {
			toast.error('Please provide a reason for failure');
			return;
		}
		setIsFailing(true);
		try {
			await earningsService.failPayout(payoutToFail.id, {
				reason: failData.reason,
			});
			toast.success('Payout marked as failed', {
				description: `${formatMoney(payoutToFail.amount, payoutToFail.currency)} for ${payoutToFail.driver_name || 'driver'}`,
			});
			setFailDialogOpen(false);
			setPayoutToFail(null);
			fetchPayouts();
			fetchDriverEarnings();
			fetchStats();
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to update payout';
			toast.error('Failed to update payout', {
				description: errorMessage,
			});
		} finally {
			setIsFailing(false);
		}
	};

	// ==================== Hold Payout ====================

	const handleOpenHold = (payout: Payout) => {
		setPayoutToHold(payout);
		setHoldData({ notes: '' });
		setHoldDialogOpen(true);
	};

	const handleHoldPayout = async () => {
		if (!payoutToHold) return;
		setIsHolding(true);
		try {
			await earningsService.holdPayout(payoutToHold.id, {
				notes: holdData.notes || undefined,
			});
			toast.success('Payout put on hold', {
				description: `${formatMoney(payoutToHold.amount, payoutToHold.currency)} for ${payoutToHold.driver_name || 'driver'}`,
			});
			setHoldDialogOpen(false);
			setPayoutToHold(null);
			fetchPayouts();
			fetchStats();
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to hold payout';
			toast.error('Failed to hold payout', { description: errorMessage });
		} finally {
			setIsHolding(false);
		}
	};

	// ==================== Driver Earnings Table ====================

	const earningsColumns: ColumnDef<DriverEarningsSummary>[] = useMemo(
		() => [
			{
				accessorKey: 'driver_name',
				header: 'Driver Name',
				cell: ({ row }) => (
					<span className='font-medium'>
						{row.original.driver_name}
					</span>
				),
			},
			{
				accessorKey: 'total_rides',
				header: 'Total Rides',
				cell: ({ row }) => (
					<span className='text-sm'>
						{row.original.total_rides.toLocaleString()}
					</span>
				),
			},
			{
				accessorKey: 'total_earnings',
				header: 'Total Earnings',
				cell: ({ row }) => (
					<span className='text-sm font-medium'>
						{formatMoney(row.original.total_earnings, row.original.currency)}
					</span>
				),
			},
			{
				accessorKey: 'pending_payout',
				header: 'Pending Payout',
				cell: ({ row }) => (
					<span className='text-sm font-medium text-orange-600'>
						{formatMoney(row.original.pending_payout, row.original.currency)}
					</span>
				),
			},
			{
				accessorKey: 'commission_paid',
				header: 'Commission',
				cell: ({ row }) => (
					<span className='text-sm'>
						{formatMoney(row.original.commission_paid, row.original.currency)}
					</span>
				),
			},
			{
				accessorKey: 'tips_received',
				header: 'Tips',
				cell: ({ row }) => (
					<span className='text-sm'>
						{formatMoney(row.original.tips_received, row.original.currency)}
					</span>
				),
			},
			{
				accessorKey: 'current_balance',
				header: 'Balance',
				cell: ({ row }) => (
					<span className='text-sm font-medium'>
						{formatMoney(row.original.current_balance, row.original.currency)}
					</span>
				),
			},
			{
				id: 'actions',
				header: '',
				cell: ({ row }) => (
					<Button
						variant='outline'
						size='sm'
						onClick={() => handleOpenCreatePayout(row.original)}
						disabled={row.original.pending_payout <= 0}
					>
						<IconCash className='mr-1 h-4 w-4' />
						Create Payout
					</Button>
				),
			},
		],
		[],
	);

	const earningsTable = useReactTable({
		data: driverEarnings,
		columns: earningsColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setEarningsSorting,
		state: { sorting: earningsSorting },
	});

	// ==================== Payouts Table ====================

	const payoutsColumns: ColumnDef<Payout>[] = useMemo(
		() => [
			{
				accessorKey: 'driver_name',
				header: 'Driver',
				cell: ({ row }) => (
					<span className='font-medium'>
						{row.original.driver_name ||
							row.original.driver_id.slice(0, 8) + '...'}
					</span>
				),
			},
			{
				accessorKey: 'amount',
				header: 'Amount',
				cell: ({ row }) => (
					<span className='text-sm font-medium'>
						{formatMoney(row.original.amount, row.original.currency)}
					</span>
				),
			},
			{
				accessorKey: 'method',
				header: 'Method',
				cell: ({ row }) => getMethodBadge(row.original.method),
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ row }) => getStatusBadge(row.original.status),
			},
			{
				accessorKey: 'reference',
				header: 'Reference',
				cell: ({ row }) => (
					<span className='text-sm text-muted-foreground'>
						{row.original.reference || '-'}
					</span>
				),
			},
			{
				accessorKey: 'requested_at',
				header: 'Requested At',
				cell: ({ row }) => (
					<span className='text-sm text-muted-foreground'>
						{formatDate(row.original.requested_at)}
					</span>
				),
			},
			{
				accessorKey: 'processed_at',
				header: 'Processed At',
				cell: ({ row }) => (
					<span className='text-sm text-muted-foreground'>
						{formatDate(row.original.processed_at)}
					</span>
				),
			},
			{
				id: 'actions',
				header: '',
				cell: ({ row }) => {
					const payout = row.original;
					return (
						<div className='flex items-center gap-1'>
							{payout.status === 'pending' && (
								<>
									<Button
										variant='outline'
										size='sm'
										onClick={() =>
											handleOpenProcess(payout)
										}
									>
										<IconPlayerPlay className='mr-1 h-3.5 w-3.5' />
										Process
									</Button>
									<Button
										variant='outline'
										size='sm'
										onClick={() => handleOpenHold(payout)}
									>
										<IconPlayerPause className='mr-1 h-3.5 w-3.5' />
										Hold
									</Button>
								</>
							)}
							{payout.status === 'processing' && (
								<>
									<Button
										variant='outline'
										size='sm'
										onClick={() =>
											handleOpenComplete(payout)
										}
									>
										<IconCheck className='mr-1 h-3.5 w-3.5' />
										Complete
									</Button>
									<Button
										variant='outline'
										size='sm'
										onClick={() => handleOpenFail(payout)}
									>
										<IconX className='mr-1 h-3.5 w-3.5' />
										Fail
									</Button>
								</>
							)}
							{payout.status === 'on_hold' && (
								<Button
									variant='outline'
									size='sm'
									onClick={() => handleOpenProcess(payout)}
								>
									<IconPlayerPlay className='mr-1 h-3.5 w-3.5' />
									Process
								</Button>
							)}
						</div>
					);
				},
			},
		],
		[],
	);

	const payoutsTable = useReactTable({
		data: payouts,
		columns: payoutsColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setPayoutsSorting,
		state: { sorting: payoutsSorting },
	});

	// ==================== Pagination Helpers ====================

	const earningsCurrentPage =
		Math.floor(earningsPagination.offset / earningsPagination.limit) + 1;
	const earningsTotalPages = Math.ceil(
		earningsPagination.total / earningsPagination.limit,
	);

	const payoutsCurrentPage =
		Math.floor(payoutsPagination.offset / payoutsPagination.limit) + 1;
	const payoutsTotalPages = Math.ceil(
		payoutsPagination.total / payoutsPagination.limit,
	);

	const handleEarningsPageChange = (newOffset: number) => {
		setEarningsPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	const handlePayoutsPageChange = (newOffset: number) => {
		setPayoutsPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	// ==================== Render ====================

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>
						Earnings & Payouts
					</h1>
					<p className='text-sm text-muted-foreground'>
						Manage driver earnings and process payouts
					</p>
				</div>
				<Button variant='outline' size='sm' onClick={handleRefresh}>
					<IconRefresh className='h-4 w-4' />
					Refresh
				</Button>
			</div>

			{/* Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className='space-y-4'
			>
				<TabsList>
					<TabsTrigger value='driver-earnings'>
						<IconCurrencyDollar className='h-4 w-4 mr-1.5' />
						Driver Earnings
					</TabsTrigger>
					<TabsTrigger value='payouts'>
						<IconReceipt className='h-4 w-4 mr-1.5' />
						Payouts
					</TabsTrigger>
				</TabsList>

				{/* ==================== Tab 1: Driver Earnings ==================== */}
				<TabsContent value='driver-earnings' className='space-y-4'>
					{/* Stats Cards */}
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
						<Card className='border-l-4 border-l-green-500'>
							<CardHeader className='pb-2'>
								<CardDescription className='flex items-center gap-2'>
									<IconCurrencyDollar className='h-4 w-4' />
									Total Driver Earnings
								</CardDescription>
								{isLoadingStats ? (
									<Skeleton className='h-8 w-32' />
								) : (
									<CardTitle className='text-2xl'>
										{formatMoney(
											stats?.total_driver_earnings || 0,
										)}
									</CardTitle>
								)}
							</CardHeader>
						</Card>

						<Card className='border-l-4 border-l-blue-500'>
							<CardHeader className='pb-2'>
								<CardDescription className='flex items-center gap-2'>
									<IconReceipt className='h-4 w-4' />
									Commission Collected
								</CardDescription>
								{isLoadingStats ? (
									<Skeleton className='h-8 w-32' />
								) : (
									<CardTitle className='text-2xl'>
										{formatMoney(
											stats?.total_commission_collected ||
												0,
										)}
									</CardTitle>
								)}
							</CardHeader>
						</Card>

						<Card className='border-l-4 border-l-orange-500'>
							<CardHeader className='pb-2'>
								<CardDescription className='flex items-center gap-2'>
									<IconClock className='h-4 w-4' />
									Pending Payouts
								</CardDescription>
								{isLoadingStats ? (
									<Skeleton className='h-8 w-32' />
								) : (
									<CardTitle className='text-2xl'>
										{formatMoney(
											stats?.pending_amount || 0,
										)}
									</CardTitle>
								)}
							</CardHeader>
						</Card>

						<Card className='border-l-4 border-l-purple-500'>
							<CardHeader className='pb-2'>
								<CardDescription className='flex items-center gap-2'>
									<IconCash className='h-4 w-4' />
									Avg Earnings/Ride
								</CardDescription>
								{isLoadingStats ? (
									<Skeleton className='h-8 w-32' />
								) : (
									<CardTitle className='text-2xl'>
										{formatMoney(
											stats?.total_driver_earnings &&
												stats?.total_payouts
												? stats.total_driver_earnings /
														stats.total_payouts
												: stats?.avg_payout_amount || 0,
										)}
									</CardTitle>
								)}
							</CardHeader>
						</Card>
					</div>

					{/* Driver Earnings Table */}
					<Card>
						<CardHeader>
							<CardTitle>Driver Earnings</CardTitle>
							<CardDescription>
								{isLoadingEarnings
									? 'Loading driver earnings...'
									: `Showing ${driverEarnings.length} of ${earningsPagination.total} drivers`}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoadingEarnings ? (
								<div className='space-y-2'>
									{[...Array(5)].map((_, i) => (
										<Skeleton
											key={i}
											className='h-12 w-full'
										/>
									))}
								</div>
							) : driverEarnings.length === 0 ? (
								<div className='flex flex-col items-center justify-center py-12 text-center'>
									<IconCurrencyDollar className='h-12 w-12 text-muted-foreground mb-4' />
									<h3 className='text-lg font-semibold'>
										No Earnings Data
									</h3>
									<p className='text-sm text-muted-foreground'>
										Driver earnings will appear here once
										rides are completed
									</p>
								</div>
							) : (
								<div className='space-y-4'>
									<div className='rounded-md border'>
										<Table>
											<TableHeader>
												{earningsTable
													.getHeaderGroups()
													.map((headerGroup) => (
														<TableRow
															key={headerGroup.id}
														>
															{headerGroup.headers.map(
																(header) => (
																	<TableHead
																		key={
																			header.id
																		}
																	>
																		{header.isPlaceholder
																			? null
																			: flexRender(
																					header
																						.column
																						.columnDef
																						.header,
																					header.getContext(),
																				)}
																	</TableHead>
																),
															)}
														</TableRow>
													))}
											</TableHeader>
											<TableBody>
												{earningsTable.getRowModel()
													.rows?.length ? (
													earningsTable
														.getRowModel()
														.rows.map((row) => (
															<TableRow
																key={row.id}
															>
																{row
																	.getVisibleCells()
																	.map(
																		(
																			cell,
																		) => (
																			<TableCell
																				key={
																					cell.id
																				}
																			>
																				{flexRender(
																					cell
																						.column
																						.columnDef
																						.cell,
																					cell.getContext(),
																				)}
																			</TableCell>
																		),
																	)}
															</TableRow>
														))
												) : (
													<TableRow>
														<TableCell
															colSpan={
																earningsColumns.length
															}
															className='h-24 text-center'
														>
															No driver earnings
															found.
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</div>

									{earningsPagination.total > 0 && (
										<div className='flex items-center justify-between'>
											<p className='text-sm text-muted-foreground'>
												Showing{' '}
												{earningsPagination.offset + 1}{' '}
												to{' '}
												{Math.min(
													earningsPagination.offset +
														earningsPagination.limit,
													earningsPagination.total,
												)}{' '}
												of {earningsPagination.total}{' '}
												drivers
											</p>
											<div className='flex items-center gap-2'>
												<Button
													variant='outline'
													size='sm'
													onClick={() =>
														handleEarningsPageChange(
															Math.max(
																0,
																earningsPagination.offset -
																	earningsPagination.limit,
															),
														)
													}
													disabled={
														earningsPagination.offset ===
														0
													}
												>
													Previous
												</Button>
												<span className='text-sm'>
													Page {earningsCurrentPage}{' '}
													of {earningsTotalPages}
												</span>
												<Button
													variant='outline'
													size='sm'
													onClick={() =>
														handleEarningsPageChange(
															earningsPagination.offset +
																earningsPagination.limit,
														)
													}
													disabled={
														earningsPagination.offset +
															earningsPagination.limit >=
														earningsPagination.total
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
				</TabsContent>

				{/* ==================== Tab 2: Payouts ==================== */}
				<TabsContent value='payouts' className='space-y-4'>
					{/* Stats Cards */}
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
						<Card className='border-l-4 border-l-green-500'>
							<CardHeader className='pb-2'>
								<CardDescription className='flex items-center gap-2'>
									<IconReceipt className='h-4 w-4' />
									Total Payouts
								</CardDescription>
								{isLoadingStats ? (
									<Skeleton className='h-8 w-16' />
								) : (
									<CardTitle className='text-3xl'>
										{stats?.total_payouts?.toLocaleString() ||
											0}
									</CardTitle>
								)}
							</CardHeader>
						</Card>

						<Card className='border-l-4 border-l-blue-500'>
							<CardHeader className='pb-2'>
								<CardDescription className='flex items-center gap-2'>
									<IconCurrencyDollar className='h-4 w-4' />
									Amount Paid
								</CardDescription>
								{isLoadingStats ? (
									<Skeleton className='h-8 w-32' />
								) : (
									<CardTitle className='text-2xl'>
										{formatMoney(
											stats?.total_amount_paid || 0,
										)}
									</CardTitle>
								)}
							</CardHeader>
						</Card>

						<Card className='border-l-4 border-l-orange-500'>
							<CardHeader className='pb-2'>
								<CardDescription className='flex items-center gap-2'>
									<IconClock className='h-4 w-4' />
									Pending
								</CardDescription>
								{isLoadingStats ? (
									<Skeleton className='h-8 w-32' />
								) : (
									<CardTitle className='text-2xl'>
										{formatMoney(
											stats?.pending_amount || 0,
										)}
									</CardTitle>
								)}
							</CardHeader>
						</Card>

						<Card className='border-l-4 border-l-red-500'>
							<CardHeader className='pb-2'>
								<CardDescription className='flex items-center gap-2'>
									<IconAlertTriangle className='h-4 w-4' />
									Failed
								</CardDescription>
								{isLoadingStats ? (
									<Skeleton className='h-8 w-16' />
								) : (
									<CardTitle className='text-3xl text-destructive'>
										{stats?.failed_payouts || 0}
									</CardTitle>
								)}
							</CardHeader>
						</Card>
					</div>

					{/* Filters */}
					<div className='flex flex-col gap-4 md:flex-row md:items-center'>
						<div className='flex gap-2'>
							<Select
								value={payoutFilters.status}
								onValueChange={(value) => {
									setPayoutFilters((prev) => ({
										...prev,
										status: value,
									}));
									setPayoutsPagination((prev) => ({
										...prev,
										offset: 0,
									}));
								}}
							>
								<SelectTrigger className='w-40'>
									<SelectValue placeholder='Status' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>
										All Statuses
									</SelectItem>
									<SelectItem value='pending'>
										Pending
									</SelectItem>
									<SelectItem value='processing'>
										Processing
									</SelectItem>
									<SelectItem value='completed'>
										Completed
									</SelectItem>
									<SelectItem value='failed'>
										Failed
									</SelectItem>
									<SelectItem value='on_hold'>
										On Hold
									</SelectItem>
								</SelectContent>
							</Select>
							<Select
								value={payoutFilters.method}
								onValueChange={(value) => {
									setPayoutFilters((prev) => ({
										...prev,
										method: value,
									}));
									setPayoutsPagination((prev) => ({
										...prev,
										offset: 0,
									}));
								}}
							>
								<SelectTrigger className='w-40'>
									<SelectValue placeholder='Method' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>
										All Methods
									</SelectItem>
									<SelectItem value='bank_transfer'>
										Bank Transfer
									</SelectItem>
									<SelectItem value='mobile_money'>
										Mobile Money
									</SelectItem>
									<SelectItem value='wallet'>
										Wallet
									</SelectItem>
								</SelectContent>
							</Select>
							{(payoutFilters.status !== 'all' ||
								payoutFilters.method !== 'all') && (
								<Button
									variant='outline'
									size='sm'
									onClick={() => {
										setPayoutFilters({
											status: 'all',
											method: 'all',
										});
										setPayoutsPagination((prev) => ({
											...prev,
											offset: 0,
										}));
									}}
								>
									Clear Filters
								</Button>
							)}
						</div>
					</div>

					{/* Payouts Table */}
					<Card>
						<CardHeader>
							<CardTitle>Payouts</CardTitle>
							<CardDescription>
								{isLoadingPayouts
									? 'Loading payouts...'
									: `Showing ${payouts.length} of ${payoutsPagination.total} payouts`}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoadingPayouts ? (
								<div className='space-y-2'>
									{[...Array(5)].map((_, i) => (
										<Skeleton
											key={i}
											className='h-12 w-full'
										/>
									))}
								</div>
							) : payouts.length === 0 ? (
								<div className='flex flex-col items-center justify-center py-12 text-center'>
									<IconReceipt className='h-12 w-12 text-muted-foreground mb-4' />
									<h3 className='text-lg font-semibold'>
										No Payouts Found
									</h3>
									<p className='text-sm text-muted-foreground'>
										Payouts will appear here once they are
										created
									</p>
								</div>
							) : (
								<div className='space-y-4'>
									<div className='rounded-md border'>
										<Table>
											<TableHeader>
												{payoutsTable
													.getHeaderGroups()
													.map((headerGroup) => (
														<TableRow
															key={headerGroup.id}
														>
															{headerGroup.headers.map(
																(header) => (
																	<TableHead
																		key={
																			header.id
																		}
																	>
																		{header.isPlaceholder
																			? null
																			: flexRender(
																					header
																						.column
																						.columnDef
																						.header,
																					header.getContext(),
																				)}
																	</TableHead>
																),
															)}
														</TableRow>
													))}
											</TableHeader>
											<TableBody>
												{payoutsTable.getRowModel().rows
													?.length ? (
													payoutsTable
														.getRowModel()
														.rows.map((row) => (
															<TableRow
																key={row.id}
															>
																{row
																	.getVisibleCells()
																	.map(
																		(
																			cell,
																		) => (
																			<TableCell
																				key={
																					cell.id
																				}
																			>
																				{flexRender(
																					cell
																						.column
																						.columnDef
																						.cell,
																					cell.getContext(),
																				)}
																			</TableCell>
																		),
																	)}
															</TableRow>
														))
												) : (
													<TableRow>
														<TableCell
															colSpan={
																payoutsColumns.length
															}
															className='h-24 text-center'
														>
															No payouts found.
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</div>

									{payoutsPagination.total > 0 && (
										<div className='flex items-center justify-between'>
											<p className='text-sm text-muted-foreground'>
												Showing{' '}
												{payoutsPagination.offset + 1}{' '}
												to{' '}
												{Math.min(
													payoutsPagination.offset +
														payoutsPagination.limit,
													payoutsPagination.total,
												)}{' '}
												of {payoutsPagination.total}{' '}
												payouts
											</p>
											<div className='flex items-center gap-2'>
												<Button
													variant='outline'
													size='sm'
													onClick={() =>
														handlePayoutsPageChange(
															Math.max(
																0,
																payoutsPagination.offset -
																	payoutsPagination.limit,
															),
														)
													}
													disabled={
														payoutsPagination.offset ===
														0
													}
												>
													Previous
												</Button>
												<span className='text-sm'>
													Page {payoutsCurrentPage} of{' '}
													{payoutsTotalPages}
												</span>
												<Button
													variant='outline'
													size='sm'
													onClick={() =>
														handlePayoutsPageChange(
															payoutsPagination.offset +
																payoutsPagination.limit,
														)
													}
													disabled={
														payoutsPagination.offset +
															payoutsPagination.limit >=
														payoutsPagination.total
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
				</TabsContent>
			</Tabs>

			{/* ==================== Create Payout Dialog ==================== */}
			<Dialog open={createPayoutOpen} onOpenChange={setCreatePayoutOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<IconCash className='h-5 w-5' />
							Create Payout
						</DialogTitle>
						<DialogDescription>
							Create a new payout for{' '}
							<span className='font-medium'>
								{createPayoutData.driver_name}
							</span>
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='payout-driver'>Driver</Label>
							<Input
								id='payout-driver'
								value={createPayoutData.driver_name}
								disabled
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='payout-amount'>
								Amount{' '}
								<span className='text-destructive'>*</span>
							</Label>
							<Input
								id='payout-amount'
								type='number'
								step='0.01'
								min='0.01'
								value={createPayoutData.amount}
								onChange={(e) =>
									setCreatePayoutData((prev) => ({
										...prev,
										amount: e.target.value,
									}))
								}
								placeholder='0.00'
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='payout-method'>
								Method{' '}
								<span className='text-destructive'>*</span>
							</Label>
							<Select
								value={createPayoutData.method}
								onValueChange={(value) =>
									setCreatePayoutData((prev) => ({
										...prev,
										method: value as PayoutMethod,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder='Select method' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='bank_transfer'>
										<div className='flex items-center gap-2'>
											<IconBuildingBank className='h-4 w-4' />
											Bank Transfer
										</div>
									</SelectItem>
									<SelectItem value='mobile_money'>
										<div className='flex items-center gap-2'>
											<IconDeviceMobile className='h-4 w-4' />
											Mobile Money
										</div>
									</SelectItem>
									<SelectItem value='wallet'>
										<div className='flex items-center gap-2'>
											<IconWallet className='h-4 w-4' />
											Wallet
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='payout-notes'>
								Notes (optional)
							</Label>
							<Textarea
								id='payout-notes'
								value={createPayoutData.notes}
								onChange={(e) =>
									setCreatePayoutData((prev) => ({
										...prev,
										notes: e.target.value,
									}))
								}
								placeholder='Add any notes about this payout...'
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setCreatePayoutOpen(false)}
							disabled={isCreatingPayout}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreatePayout}
							disabled={isCreatingPayout}
						>
							{isCreatingPayout ? 'Creating...' : 'Create Payout'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ==================== Process Payout Dialog ==================== */}
			<Dialog
				open={processDialogOpen}
				onOpenChange={setProcessDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<IconPlayerPlay className='h-5 w-5 text-blue-600' />
							Process Payout
						</DialogTitle>
						<DialogDescription>
							Begin processing payout of{' '}
							<span className='font-medium'>
								{formatMoney(payoutToProcess?.amount || 0, payoutToProcess?.currency)}
							</span>{' '}
							for{' '}
							<span className='font-medium'>
								{payoutToProcess?.driver_name || 'driver'}
							</span>
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='process-reference'>
								Reference (optional)
							</Label>
							<Input
								id='process-reference'
								value={processData.reference}
								onChange={(e) =>
									setProcessData((prev) => ({
										...prev,
										reference: e.target.value,
									}))
								}
								placeholder='Transaction reference or ID'
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='process-notes'>
								Notes (optional)
							</Label>
							<Textarea
								id='process-notes'
								value={processData.notes}
								onChange={(e) =>
									setProcessData((prev) => ({
										...prev,
										notes: e.target.value,
									}))
								}
								placeholder='Add any processing notes...'
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setProcessDialogOpen(false)}
							disabled={isProcessing}
						>
							Cancel
						</Button>
						<Button
							onClick={handleProcessPayout}
							disabled={isProcessing}
						>
							{isProcessing
								? 'Processing...'
								: 'Start Processing'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ==================== Complete Payout Dialog ==================== */}
			<Dialog
				open={completeDialogOpen}
				onOpenChange={setCompleteDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<IconCheck className='h-5 w-5 text-green-600' />
							Complete Payout
						</DialogTitle>
						<DialogDescription>
							Mark payout of{' '}
							<span className='font-medium'>
								{formatMoney(payoutToComplete?.amount || 0, payoutToComplete?.currency)}
							</span>{' '}
							as completed for{' '}
							<span className='font-medium'>
								{payoutToComplete?.driver_name || 'driver'}
							</span>
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='complete-reference'>
								Reference (optional)
							</Label>
							<Input
								id='complete-reference'
								value={completeData.reference}
								onChange={(e) =>
									setCompleteData((prev) => ({
										...prev,
										reference: e.target.value,
									}))
								}
								placeholder='Final transaction reference'
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setCompleteDialogOpen(false)}
							disabled={isCompleting}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCompletePayout}
							disabled={isCompleting}
							className='bg-green-600 text-white hover:bg-green-700'
						>
							{isCompleting
								? 'Completing...'
								: 'Mark as Completed'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ==================== Fail Payout Dialog ==================== */}
			<Dialog open={failDialogOpen} onOpenChange={setFailDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<IconX className='h-5 w-5 text-destructive' />
							Fail Payout
						</DialogTitle>
						<DialogDescription>
							Mark payout of{' '}
							<span className='font-medium'>
								{formatMoney(payoutToFail?.amount || 0, payoutToFail?.currency)}
							</span>{' '}
							as failed for{' '}
							<span className='font-medium'>
								{payoutToFail?.driver_name || 'driver'}
							</span>
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='fail-reason'>
								Failure Reason{' '}
								<span className='text-destructive'>*</span>
							</Label>
							<Textarea
								id='fail-reason'
								value={failData.reason}
								onChange={(e) =>
									setFailData((prev) => ({
										...prev,
										reason: e.target.value,
									}))
								}
								placeholder='Describe the reason for failure...'
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setFailDialogOpen(false)}
							disabled={isFailing}
						>
							Cancel
						</Button>
						<Button
							onClick={handleFailPayout}
							disabled={isFailing || !failData.reason.trim()}
							variant='destructive'
						>
							{isFailing ? 'Updating...' : 'Mark as Failed'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ==================== Hold Payout Dialog ==================== */}
			<Dialog open={holdDialogOpen} onOpenChange={setHoldDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<IconPlayerPause className='h-5 w-5 text-orange-600' />
							Hold Payout
						</DialogTitle>
						<DialogDescription>
							Put payout of{' '}
							<span className='font-medium'>
								{formatMoney(payoutToHold?.amount || 0, payoutToHold?.currency)}
							</span>{' '}
							on hold for{' '}
							<span className='font-medium'>
								{payoutToHold?.driver_name || 'driver'}
							</span>
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='hold-notes'>Notes (optional)</Label>
							<Textarea
								id='hold-notes'
								value={holdData.notes}
								onChange={(e) =>
									setHoldData((prev) => ({
										...prev,
										notes: e.target.value,
									}))
								}
								placeholder='Reason for putting the payout on hold...'
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setHoldDialogOpen(false)}
							disabled={isHolding}
						>
							Cancel
						</Button>
						<Button onClick={handleHoldPayout} disabled={isHolding}>
							{isHolding ? 'Updating...' : 'Put On Hold'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
