'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
	IconRefresh,
	IconUserCheck,
	IconUserX,
	IconSearch,
	IconSteeringWheel,
	IconCloudCheck,
	IconCloudOff,
	IconClock,
} from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import { Driver } from '@/lib/types/models';
import { DriversTable } from '@/components/drivers-table';
import { DriverDetailSheet } from '@/components/driver-detail-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DriverStats {
	total: number;
	online: number;
	offline: number;
	available: number;
	pending: number;
}

export default function DriversPage() {
	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
	const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
	const [isLoadingPending, setIsLoadingPending] = useState(true);
	const [activeTab, setActiveTab] = useState('all');
	const [searchQuery, setSearchQuery] = useState('');
	const searchQueryRef = useRef(searchQuery);
	searchQueryRef.current = searchQuery;
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [stats, setStats] = useState<DriverStats | null>(null);
	const [isLoadingStats, setIsLoadingStats] = useState(true);

	const [pagination, setPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});
	const [pendingPagination, setPendingPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});

	// Driver detail sheet state
	const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
	const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

	// Approve dialog state
	const [approveDialogOpen, setApproveDialogOpen] = useState(false);
	const [approveNotes, setApproveNotes] = useState('');
	const [driverToApprove, setDriverToApprove] = useState<Driver | null>(null);
	const [isApproving, setIsApproving] = useState(false);

	// Reject dialog state
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [rejectReason, setRejectReason] = useState('');
	const [driverToReject, setDriverToReject] = useState<Driver | null>(null);
	const [isRejecting, setIsRejecting] = useState(false);

	// Fetch driver stats from meta
	const fetchStats = useCallback(async () => {
		try {
			setIsLoadingStats(true);
			// Fetch drivers with no filters to get full stats from meta
			const response = await adminService.getDrivers({ limit: 1 });

			// Extract stats from meta
			if (response.meta.stats) {
				const s = response.meta.stats;
				setStats({
					total: Number(s.total_drivers) || 0,
					online: Number(s.online_drivers) || 0,
					offline: Number(s.offline_drivers) || 0,
					available: Number(s.available_drivers) || 0,
					pending: Number(s.pending_approvals) || 0,
				});
			}
		} catch (error) {
			console.error('Failed to fetch stats:', error);
		} finally {
			setIsLoadingStats(false);
		}
	}, []);

	const fetchDrivers = useCallback(async () => {
		try {
			setIsLoadingDrivers(true);
			const response = await adminService.getDrivers({
				limit: pagination.limit,
				offset: pagination.offset,
				...(statusFilter !== 'all' && { status: statusFilter as 'online' | 'offline' | 'available' | 'pending' }),
				...(searchQueryRef.current && { search: searchQueryRef.current }),
			});
			setDrivers(response.data);
			setPagination((prev) => ({ ...prev, total: response.meta.total }));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load drivers';
			toast.error('Failed to load drivers', { description: errorMessage });
		} finally {
			setIsLoadingDrivers(false);
		}
	}, [pagination.limit, pagination.offset, statusFilter]);

	const fetchPendingDrivers = useCallback(async () => {
		try {
			setIsLoadingPending(true);
			const response = await adminService.getPendingDrivers({
				limit: pendingPagination.limit,
				offset: pendingPagination.offset,
			});
			setPendingDrivers(response.data);
			setPendingPagination((prev) => ({ ...prev, total: response.meta.total }));
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to load pending drivers';
			toast.error('Failed to load pending drivers', { description: errorMessage });
		} finally {
			setIsLoadingPending(false);
		}
	}, [pendingPagination.limit, pendingPagination.offset]);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	useEffect(() => {
		fetchDrivers();
	}, [fetchDrivers]);

	useEffect(() => {
		fetchPendingDrivers();
	}, [fetchPendingDrivers]);

	const handleSearch = () => {
		setPagination((prev) => ({ ...prev, offset: 0 }));
		fetchDrivers();
	};

	const handleRefresh = () => {
		if (activeTab === 'all') {
			fetchDrivers();
		} else {
			fetchPendingDrivers();
		}
		fetchStats();
		toast.success('Drivers refreshed');
	};

	const handlePageChange = (newOffset: number, isPending: boolean) => {
		if (isPending) {
			setPendingPagination((prev) => ({ ...prev, offset: newOffset }));
		} else {
			setPagination((prev) => ({ ...prev, offset: newOffset }));
		}
	};

	// View driver details
	const handleViewDriver = async (driverId: string) => {
		try {
			const driver = await adminService.getDriver(driverId);
			setSelectedDriver(driver);
			setIsDetailSheetOpen(true);
		} catch {
			toast.error('Failed to load driver details');
		}
	};

	// Open approve dialog
	const handleApproveClick = (driver: Driver) => {
		setDriverToApprove(driver);
		setApproveNotes('');
		setApproveDialogOpen(true);
	};

	// Confirm approve
	const handleConfirmApprove = async () => {
		if (!driverToApprove) return;

		try {
			setIsApproving(true);
			await adminService.approveDriver(driverToApprove.id, {
				notes: approveNotes || 'Approved via admin panel',
			});
			toast.success('Driver approved successfully', {
				description: `${driverToApprove.user?.first_name} ${driverToApprove.user?.last_name} has been approved.`,
			});
			setApproveDialogOpen(false);
			setDriverToApprove(null);
			setApproveNotes('');
			fetchPendingDrivers();
			fetchDrivers();
			fetchStats();

			// Update detail sheet if open
			if (selectedDriver?.id === driverToApprove.id) {
				setSelectedDriver({ ...selectedDriver, approval_status: 'approved' });
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to approve driver';
			toast.error('Failed to approve driver', { description: errorMessage });
		} finally {
			setIsApproving(false);
		}
	};

	// Open reject dialog
	const handleRejectClick = (driver: Driver) => {
		setDriverToReject(driver);
		setRejectReason('');
		setRejectDialogOpen(true);
	};

	// Confirm reject
	const handleConfirmReject = async () => {
		if (!driverToReject || !rejectReason.trim()) {
			toast.error('Please provide a reason for rejection');
			return;
		}

		try {
			setIsRejecting(true);
			await adminService.rejectDriver(driverToReject.id, {
				reason: rejectReason,
			});
			toast.success('Driver rejected', {
				description: `${driverToReject.user?.first_name} ${driverToReject.user?.last_name} application has been rejected.`,
			});
			setRejectDialogOpen(false);
			setDriverToReject(null);
			setRejectReason('');
			fetchPendingDrivers();
			fetchStats();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to reject driver';
			toast.error('Failed to reject driver', { description: errorMessage });
		} finally {
			setIsRejecting(false);
		}
	};

	// Handle driver action from table
	const handleDriverAction = useCallback(
		(action: 'approve' | 'reject' | 'view', driverId: string) => {
			const driver = [...drivers, ...pendingDrivers].find((d) => d.id === driverId);
			if (!driver) return;

			if (action === 'view') {
				handleViewDriver(driverId);
			} else if (action === 'approve') {
				handleApproveClick(driver);
			} else if (action === 'reject') {
				handleRejectClick(driver);
			}
		},
		[drivers, pendingDrivers]
	);

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Drivers</h1>
					<p className='text-sm text-muted-foreground'>
						Manage drivers and approve applications
					</p>
				</div>
				<Button variant='outline' size='sm' onClick={handleRefresh}>
					<IconRefresh className='h-4 w-4' />
					Refresh
				</Button>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconSteeringWheel className='h-4 w-4' />
							Total Drivers
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl'>{stats?.total || 0}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							All registered drivers
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCloudCheck className='h-4 w-4 text-green-600' />
							Online
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-green-600'>{stats?.online || 0}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							Currently online drivers
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconUserCheck className='h-4 w-4 text-blue-600' />
							Available
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-blue-600'>
								{stats?.available || 0}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							Online & available
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCloudOff className='h-4 w-4 text-muted-foreground' />
							Offline
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-muted-foreground'>
								{stats?.offline || 0}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							Currently offline drivers
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconClock className='h-4 w-4 text-orange-500' />
							Pending Approvals
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-orange-500'>{stats?.pending || 0}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							Awaiting review
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-4'>
				<TabsList>
					<TabsTrigger value='all' className='gap-2'>
						All Drivers
						<Badge variant='secondary'>{pagination.total}</Badge>
					</TabsTrigger>
					<TabsTrigger value='pending' className='gap-2'>
						<IconUserCheck className='h-4 w-4' />
						Pending Approvals
						{pendingPagination.total > 0 && (
							<Badge variant='destructive'>{pendingPagination.total}</Badge>
						)}
					</TabsTrigger>
				</TabsList>

				<TabsContent value='all' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>All Drivers</CardTitle>
							<CardDescription>
								Search and manage all registered drivers
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							{/* Filters */}
							<div className='flex flex-col gap-4 md:flex-row md:items-center'>
								<div className='flex-1'>
									<div className='relative'>
										<IconSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
										<Input
											placeholder='Search by license, name, or vehicle...'
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
									<Select value={statusFilter} onValueChange={setStatusFilter}>
										<SelectTrigger className='w-[130px]'>
											<SelectValue placeholder='Status' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>All Status</SelectItem>
											<SelectItem value='online'>Online</SelectItem>
											<SelectItem value='offline'>Offline</SelectItem>
											<SelectItem value='available'>Available</SelectItem>
											<SelectItem value='pending'>Pending</SelectItem>
										</SelectContent>
									</Select>
									<Button onClick={handleSearch}>Search</Button>
								</div>
							</div>

							{/* Drivers Table */}
							<DriversTable
								drivers={drivers}
								isLoading={isLoadingDrivers}
								pagination={pagination}
								onPageChange={(offset) => handlePageChange(offset, false)}
								showActions={false}
								onDriverAction={handleDriverAction}
							/>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='pending' className='space-y-4'>
					<Card>
						<CardHeader>
							<CardTitle>Driver Applications</CardTitle>
							<CardDescription>
								Review and approve pending driver applications
							</CardDescription>
						</CardHeader>
						<CardContent>
							<DriversTable
								drivers={pendingDrivers}
								isLoading={isLoadingPending}
								pagination={pendingPagination}
								onPageChange={(offset) => handlePageChange(offset, true)}
								showActions={true}
								onDriverAction={handleDriverAction}
							/>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Driver Detail Sheet */}
			<DriverDetailSheet
				driver={selectedDriver}
				open={isDetailSheetOpen}
				onOpenChange={setIsDetailSheetOpen}
				onApprove={() => selectedDriver && handleApproveClick(selectedDriver)}
				onReject={() => selectedDriver && handleRejectClick(selectedDriver)}
			/>

			{/* Approve Confirmation Dialog */}
			<AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<IconUserCheck className='h-5 w-5 text-green-600' />
							Approve Driver
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to approve{' '}
							<span className='font-medium'>
								{driverToApprove?.user?.first_name} {driverToApprove?.user?.last_name}
							</span>
							? This will allow them to start accepting rides.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className='space-y-2 py-4'>
						<Label htmlFor='approve-notes'>Notes (optional)</Label>
						<Textarea
							id='approve-notes'
							placeholder='Add any notes about this approval...'
							value={approveNotes}
							onChange={(e) => setApproveNotes(e.target.value)}
							rows={3}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmApprove}
							disabled={isApproving}
							className='bg-green-600 text-white hover:bg-green-700'
						>
							{isApproving ? 'Approving...' : 'Approve Driver'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Reject Confirmation Dialog */}
			<AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<IconUserX className='h-5 w-5 text-destructive' />
							Reject Driver Application
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to reject{' '}
							<span className='font-medium'>
								{driverToReject?.user?.first_name} {driverToReject?.user?.last_name}
							</span>
							? This will be communicated to the applicant.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className='space-y-2 py-4'>
						<Label htmlFor='reject-reason'>Reason for rejection</Label>
						<Textarea
							id='reject-reason'
							placeholder='Enter the reason for rejecting this application...'
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							rows={3}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isRejecting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmReject}
							disabled={isRejecting || !rejectReason.trim()}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							{isRejecting ? 'Rejecting...' : 'Reject Application'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
