'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { IconRefresh, IconFilter } from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import { Ride } from '@/lib/types/models';
import { RidesTable } from '@/components/rides-table';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RidesPage() {
	const [rides, setRides] = useState<Ride[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [stats, setStats] = useState<{
		total_rides: number;
		completed_rides: number;
		cancelled_rides: number;
		total_revenue: number;
		average_fare: number;
		average_rating: number;
	} | null>(null);
	const [pagination, setPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});

	const fetchRides = async () => {
		try {
			setIsLoading(true);
			const response = await adminService.getRides({
				limit: pagination.limit,
				offset: pagination.offset,
				...(statusFilter !== 'all' && { status: statusFilter }),
			});
			setRides(response.data);
			setPagination((prev) => ({ ...prev, total: response.meta.total }));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load rides';
			toast.error('Failed to load rides', { description: errorMessage });
		} finally {
			setIsLoading(false);
		}
	};

	const fetchStats = async () => {
		try {
			const rideStats = await adminService.getRideStats({});
			setStats(rideStats);
		} catch (error) {
			console.error('Failed to load ride stats:', error);
		}
	};

	useEffect(() => {
		fetchRides();
		fetchStats();
	}, [pagination.offset, pagination.limit, statusFilter]);

	const handleRefresh = () => {
		fetchRides();
		fetchStats();
		toast.success('Rides refreshed');
	};

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(value);
	};

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Rides</h1>
					<p className='text-sm text-muted-foreground'>
						Monitor and manage all rides in the system
					</p>
				</div>
				<div className='flex gap-2'>
					<Button variant='outline' size='sm' onClick={handleRefresh}>
						<IconRefresh className='h-4 w-4' />
						Refresh
					</Button>
				</div>
			</div>

			{stats && (
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
					<Card>
						<CardHeader className='pb-2'>
							<CardDescription>Total Rides</CardDescription>
							<CardTitle className='text-2xl'>{stats.total_rides}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-xs text-muted-foreground'>
								Completed: {stats.completed_rides}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='pb-2'>
							<CardDescription>Total Revenue</CardDescription>
							<CardTitle className='text-2xl'>
								{formatCurrency(stats.total_revenue)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-xs text-muted-foreground'>
								Avg: {formatCurrency(stats.average_fare)}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='pb-2'>
							<CardDescription>Cancelled Rides</CardDescription>
							<CardTitle className='text-2xl'>{stats.cancelled_rides}</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-xs text-muted-foreground'>
								{((stats.cancelled_rides / stats.total_rides) * 100).toFixed(1)}%
								cancellation rate
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className='pb-2'>
							<CardDescription>Average Rating</CardDescription>
							<CardTitle className='text-2xl'>
								{stats.average_rating.toFixed(1)} ⭐
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className='text-xs text-muted-foreground'>Customer satisfaction</p>
						</CardContent>
					</Card>
				</div>
			)}

			<div className='flex flex-col gap-4 rounded-lg border p-4'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center gap-2'>
						<IconFilter className='h-4 w-4 text-muted-foreground' />
						<span className='text-sm font-medium'>Filters</span>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className='w-[180px]'>
							<SelectValue placeholder='Status' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All Status</SelectItem>
							<SelectItem value='requested'>Requested</SelectItem>
							<SelectItem value='accepted'>Accepted</SelectItem>
							<SelectItem value='in_progress'>In Progress</SelectItem>
							<SelectItem value='completed'>Completed</SelectItem>
							<SelectItem value='cancelled'>Cancelled</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<RidesTable
					rides={rides}
					isLoading={isLoading}
					pagination={pagination}
					onPageChange={handlePageChange}
				/>
			</div>
		</div>
	);
}
