'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
	IconRefresh,
	IconFilter,
	IconCar,
	IconCurrencyDollar,
	IconX,
	IconCheck,
	IconStar,
	IconClock,
	IconPlayerPlay,
	IconTrendingUp,
	IconTrendingDown,
} from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import { Ride } from '@/lib/types/models';
import { RidesTable } from '@/components/rides-table';
import { RideDetailSheet } from '@/components/ride-detail-sheet';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
import { DatePicker } from '@/components/date-picker';

interface RideStats {
	total_rides: number;
	completed_rides: number;
	cancelled_rides: number;
	total_revenue: number;
	average_fare: number;
	average_rating: number;
}

export default function RidesPage() {
	const [rides, setRides] = useState<Ride[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [stats, setStats] = useState<RideStats | null>(null);
	const [pagination, setPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});

	// Date range filters
	const [startDate, setStartDate] = useState<Date | undefined>(undefined);
	const [endDate, setEndDate] = useState<Date | undefined>(undefined);

	// Detail sheet state
	const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
	const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

	// Cancel dialog state
	const [rideToCancel, setRideToCancel] = useState<Ride | null>(null);
	const [showCancelDialog, setShowCancelDialog] = useState(false);

	// Monotonic counter bumped by the Refresh button to re-run the load effect.
	const [refreshTick, setRefreshTick] = useState(0);

	useEffect(() => {
		let active = true;
		const startDateStr = startDate?.toISOString().split('T')[0];
		const endDateStr = endDate?.toISOString().split('T')[0];

		(async () => {
			try {
				const [ridesRes, statsRes] = await Promise.all([
					adminService.getRecentRides({
						limit: pagination.limit,
						offset: pagination.offset,
						...(statusFilter !== 'all' && { status: statusFilter }),
						...(startDateStr && { start_date: startDateStr }),
						...(endDateStr && { end_date: endDateStr }),
					}),
					adminService
						.getRideStats({
							...(startDateStr && { start_date: startDateStr }),
							...(endDateStr && { end_date: endDateStr }),
						})
						.catch((err) => {
							console.error('Failed to load ride stats:', err);
							return null;
						}),
				]);
				if (!active) return;
				setRides(ridesRes.data);
				setPagination((prev) => ({ ...prev, total: ridesRes.meta.total }));
				if (statsRes) setStats(statsRes);
			} catch (error) {
				if (!active) return;
				const errorMessage = error instanceof Error ? error.message : 'Failed to load rides';
				toast.error('Failed to load rides', { description: errorMessage });
			} finally {
				if (active) setIsLoading(false);
			}
		})();
		return () => {
			active = false;
		};
	}, [pagination.limit, pagination.offset, statusFilter, startDate, endDate, refreshTick]);

	const handleRefresh = () => {
		setIsLoading(true);
		setRefreshTick((t) => t + 1);
		toast.success('Rides refreshed');
	};

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	const handleViewRide = useCallback((rideId: string) => {
		const ride = rides.find((r) => r.id === rideId);
		if (ride) {
			setSelectedRide(ride);
			setIsDetailSheetOpen(true);
		}
	}, [rides]);

	const handleCancelClick = useCallback((rideId: string) => {
		const ride = rides.find((r) => r.id === rideId);
		if (ride) {
			setRideToCancel(ride);
			setShowCancelDialog(true);
		}
	}, [rides]);

	const handleRideAction = useCallback(
		(action: 'view' | 'cancel', rideId: string) => {
			if (action === 'view') {
				handleViewRide(rideId);
			} else if (action === 'cancel') {
				handleCancelClick(rideId);
			}
		},
		[handleViewRide, handleCancelClick]
	);

	const handleConfirmCancel = async () => {
		if (!rideToCancel) return;
		try {
			await adminService.cancelRide(rideToCancel.id, { reason: 'Cancelled by admin' });
			toast.success('Ride cancelled successfully');
			setShowCancelDialog(false);
			setRideToCancel(null);
			setRefreshTick((t) => t + 1);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to cancel ride';
			toast.error('Failed to cancel ride', { description: errorMessage });
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(value);
	};

	const handleClearFilters = () => {
		setStatusFilter('all');
		setStartDate(undefined);
		setEndDate(undefined);
		setPagination((prev) => ({ ...prev, offset: 0 }));
	};

	const hasActiveFilters = statusFilter !== 'all' || startDate || endDate;

	// Calculate derived stats with null safety
	const completionRate = stats && stats.total_rides > 0
		? (((stats.completed_rides ?? 0) / stats.total_rides) * 100).toFixed(1)
		: '0';
	const cancellationRate = stats && stats.total_rides > 0
		? (((stats.cancelled_rides ?? 0) / stats.total_rides) * 100).toFixed(1)
		: '0';
	const inProgressRides = stats
		? (stats.total_rides ?? 0) - (stats.completed_rides ?? 0) - (stats.cancelled_rides ?? 0)
		: 0;

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Rides</h1>
					<p className='text-sm text-muted-foreground'>
						Monitor and manage all rides in the system
					</p>
				</div>
				<div className='flex gap-2'>
					<Button variant='outline' size='sm' onClick={handleRefresh}>
						<IconRefresh className='h-4 w-4 mr-2' />
						Refresh
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			{stats && (
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
					<Card>
						<CardHeader className='flex flex-row items-center justify-between pb-2'>
							<CardDescription>Total Rides</CardDescription>
							<IconCar className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{(stats.total_rides ?? 0).toLocaleString()}</div>
							<p className='text-xs text-muted-foreground mt-1'>
								<span className='text-blue-600'>{inProgressRides}</span> in progress
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between pb-2'>
							<CardDescription>Completed</CardDescription>
							<IconCheck className='h-4 w-4 text-green-600' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-green-600'>
								{(stats.completed_rides ?? 0).toLocaleString()}
							</div>
							<div className='flex items-center gap-1 mt-1'>
								<IconTrendingUp className='h-3 w-3 text-green-600' />
								<span className='text-xs text-green-600'>{completionRate}% completion rate</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between pb-2'>
							<CardDescription>Cancelled</CardDescription>
							<IconX className='h-4 w-4 text-red-600' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold text-red-600'>
								{(stats.cancelled_rides ?? 0).toLocaleString()}
							</div>
							<div className='flex items-center gap-1 mt-1'>
								<IconTrendingDown className='h-3 w-3 text-red-600' />
								<span className='text-xs text-red-600'>{cancellationRate}% cancellation rate</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between pb-2'>
							<CardDescription>Total Revenue</CardDescription>
							<IconCurrencyDollar className='h-4 w-4 text-green-600' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{formatCurrency(stats.total_revenue ?? 0)}</div>
							<p className='text-xs text-muted-foreground mt-1'>
								Avg: {formatCurrency(stats.average_fare ?? 0)}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='flex flex-row items-center justify-between pb-2'>
							<CardDescription>Average Rating</CardDescription>
							<IconStar className='h-4 w-4 text-yellow-500' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold flex items-center gap-1'>
								{(stats.average_rating ?? 0).toFixed(1)}
								<IconStar className='h-5 w-5 fill-yellow-400 text-yellow-400' />
							</div>
							<p className='text-xs text-muted-foreground mt-1'>Customer satisfaction</p>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Filters and Table */}
			<div className='flex flex-col gap-4 rounded-lg border p-4'>
				<div className='flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
					<div className='flex items-center gap-2'>
						<IconFilter className='h-4 w-4 text-muted-foreground' />
						<span className='text-sm font-medium'>Filters</span>
						{hasActiveFilters && (
							<Button variant='ghost' size='sm' onClick={handleClearFilters} className='h-7 px-2'>
								Clear all
							</Button>
						)}
					</div>

					<div className='flex flex-col sm:flex-row gap-3'>
						{/* Date Range Filters */}
						<div className='flex items-center gap-2'>
							<DatePicker
								date={startDate}
								setDate={setStartDate}
								label={<span className='text-xs text-muted-foreground'>Start Date</span>}
								placeholder='Select start date'
							/>
							<DatePicker
								date={endDate}
								setDate={setEndDate}
								label={<span className='text-xs text-muted-foreground'>End Date</span>}
								placeholder='Select end date'
							/>
						</div>

						{/* Status Filter */}
						<div className='flex flex-col gap-1'>
							<Label className='text-xs text-muted-foreground'>Status</Label>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className='w-[180px]'>
									<SelectValue placeholder='Status' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Status</SelectItem>
									<SelectItem value='requested'>
										<div className='flex items-center gap-2'>
											<IconClock className='h-4 w-4 text-blue-600' />
											Requested
										</div>
									</SelectItem>
									<SelectItem value='accepted'>
										<div className='flex items-center gap-2'>
											<IconCheck className='h-4 w-4 text-purple-600' />
											Accepted
										</div>
									</SelectItem>
									<SelectItem value='in_progress'>
										<div className='flex items-center gap-2'>
											<IconPlayerPlay className='h-4 w-4 text-yellow-600' />
											In Progress
										</div>
									</SelectItem>
									<SelectItem value='completed'>
										<div className='flex items-center gap-2'>
											<IconCheck className='h-4 w-4 text-green-600' />
											Completed
										</div>
									</SelectItem>
									<SelectItem value='cancelled'>
										<div className='flex items-center gap-2'>
											<IconX className='h-4 w-4 text-red-600' />
											Cancelled
										</div>
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				<RidesTable
					rides={rides}
					isLoading={isLoading}
					pagination={pagination}
					onPageChange={handlePageChange}
					onRideAction={handleRideAction}
				/>
			</div>

			{/* Ride Detail Sheet */}
			<RideDetailSheet
				ride={selectedRide}
				open={isDetailSheetOpen}
				onOpenChange={setIsDetailSheetOpen}
				onCancelRide={(rideId) => {
					setIsDetailSheetOpen(false);
					handleCancelClick(rideId);
				}}
			/>

			{/* Cancel Ride Dialog */}
			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel Ride</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to cancel this ride? This action cannot be undone.
							{rideToCancel && (
								<div className='mt-4 p-3 rounded-md bg-muted'>
									<div className='text-sm'>
										<span className='font-medium'>Ride ID:</span>{' '}
										<span className='font-mono'>{rideToCancel.id.substring(0, 12)}...</span>
									</div>
									{rideToCancel.rider && (
										<div className='text-sm mt-1'>
											<span className='font-medium'>Rider:</span>{' '}
											{rideToCancel.rider.first_name} {rideToCancel.rider.last_name}
										</div>
									)}
									<div className='text-sm mt-1'>
										<span className='font-medium'>Route:</span> {rideToCancel.pickup_address} →{' '}
										{rideToCancel.dropoff_address}
									</div>
								</div>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>No, keep ride</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmCancel}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							Yes, cancel ride
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
