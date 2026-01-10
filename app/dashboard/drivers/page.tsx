'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { IconPlus, IconRefresh, IconUserCheck, IconUserX } from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import { Driver } from '@/lib/types/models';
import { DriversTable } from '@/components/drivers-table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function DriversPage() {
	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
	const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
	const [isLoadingPending, setIsLoadingPending] = useState(true);
	const [activeTab, setActiveTab] = useState('all');
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

	const fetchDrivers = async () => {
		try {
			setIsLoadingDrivers(true);
			const response = await adminService.getDrivers({
				limit: pagination.limit,
				offset: pagination.offset,
			});
			setDrivers(response.data);
			setPagination((prev) => ({ ...prev, total: response.total }));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load drivers';
			toast.error('Failed to load drivers', { description: errorMessage });
		} finally {
			setIsLoadingDrivers(false);
		}
	};

	const fetchPendingDrivers = async () => {
		try {
			setIsLoadingPending(true);
			const response = await adminService.getPendingDrivers({
				limit: pendingPagination.limit,
				offset: pendingPagination.offset,
			});
			setPendingDrivers(response.data);
			setPendingPagination((prev) => ({ ...prev, total: response.total }));
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to load pending drivers';
			toast.error('Failed to load pending drivers', { description: errorMessage });
		} finally {
			setIsLoadingPending(false);
		}
	};

	useEffect(() => {
		fetchDrivers();
	}, [pagination.offset, pagination.limit]);

	useEffect(() => {
		fetchPendingDrivers();
	}, [pendingPagination.offset, pendingPagination.limit]);

	const handleRefresh = () => {
		if (activeTab === 'all') {
			fetchDrivers();
		} else {
			fetchPendingDrivers();
		}
		toast.success('Drivers refreshed');
	};

	const handleApprove = async (driverId: string) => {
		try {
			await adminService.approveDriver(driverId, {
				notes: 'Approved via admin panel',
			});
			toast.success('Driver approved successfully');
			fetchPendingDrivers();
			fetchDrivers();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to approve driver';
			toast.error('Failed to approve driver', { description: errorMessage });
		}
	};

	const handleReject = async (driverId: string, reason: string) => {
		try {
			await adminService.rejectDriver(driverId, {
				reason: reason || 'Rejected via admin panel',
			});
			toast.success('Driver rejected');
			fetchPendingDrivers();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to reject driver';
			toast.error('Failed to reject driver', { description: errorMessage });
		}
	};

	const handlePageChange = (newOffset: number, isPending: boolean) => {
		if (isPending) {
			setPendingPagination((prev) => ({ ...prev, offset: newOffset }));
		} else {
			setPagination((prev) => ({ ...prev, offset: newOffset }));
		}
	};

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Drivers</h1>
					<p className='text-sm text-muted-foreground'>
						Manage drivers and approve applications
					</p>
				</div>
				<div className='flex gap-2'>
					<Button variant='outline' size='sm' onClick={handleRefresh}>
						<IconRefresh className='h-4 w-4' />
						Refresh
					</Button>
					<Button size='sm'>
						<IconPlus className='h-4 w-4' />
						Add Driver
					</Button>
				</div>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className='space-y-4'>
				<TabsList>
					<TabsTrigger value='all' className='gap-2'>
						All Drivers
						<Badge variant='secondary'>{pagination.total}</Badge>
					</TabsTrigger>
					<TabsTrigger value='pending' className='gap-2'>
						<IconUserCheck className='h-4 w-4' />
						Pending Approvals
						<Badge variant='destructive'>{pendingPagination.total}</Badge>
					</TabsTrigger>
				</TabsList>

				<TabsContent value='all' className='space-y-4'>
					<div className='rounded-lg border p-4'>
						<DriversTable
							drivers={drivers}
							isLoading={isLoadingDrivers}
							pagination={pagination}
							onPageChange={(offset) => handlePageChange(offset, false)}
							showActions={false}
						/>
					</div>
				</TabsContent>

				<TabsContent value='pending' className='space-y-4'>
					<div className='rounded-lg border p-4'>
						<div className='mb-4'>
							<h3 className='font-semibold'>Driver Applications</h3>
							<p className='text-sm text-muted-foreground'>
								Review and approve pending driver applications
							</p>
						</div>
						<DriversTable
							drivers={pendingDrivers}
							isLoading={isLoadingPending}
							pagination={pendingPagination}
							onPageChange={(offset) => handlePageChange(offset, true)}
							showActions={true}
							onApprove={handleApprove}
							onReject={handleReject}
						/>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
