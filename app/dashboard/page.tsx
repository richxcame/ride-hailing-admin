'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
	IconRefresh,
	IconTrendingUp,
	IconTrendingDown,
	IconCar,
	IconUsers,
	IconCurrencyDollar,
	IconAlertTriangle,
	IconClock,
	IconArrowRight,
} from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import {
	RealtimeMetrics,
	DashboardSummary,
	RevenueTrend,
	ActivityFeedItem,
} from '@/lib/types/models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
	const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);
	const [summary, setSummary] = useState<DashboardSummary | null>(null);
	const [revenueTrend, setRevenueTrend] = useState<RevenueTrend | null>(null);
	const [actionItems, setActionItems] = useState<Awaited<ReturnType<typeof adminService.getActionItems>> | null>(null);
	const [isLoadingRealtime, setIsLoadingRealtime] = useState(true);
	const [isLoadingSummary, setIsLoadingSummary] = useState(true);
	const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);
	const [isLoadingActions, setIsLoadingActions] = useState(true);
	const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

	// Revenue chart filters
	const [revenuePeriod, setRevenuePeriod] = useState<'today' | '7days' | '30days' | '90days' | 'year'>('7days');
	const [revenueGroupBy, setRevenueGroupBy] = useState<'hour' | 'day' | 'week' | 'month'>('day');

	const fetchRealtimeMetrics = async () => {
		try {
			setIsLoadingRealtime(true);
			const metrics = await adminService.getRealtimeMetrics();
			setRealtimeMetrics(metrics);
			setLastUpdated(new Date());
		} catch (err) {
			console.error('Failed to load realtime metrics:', err);
			toast.error('Failed to load real-time metrics');
		} finally {
			setIsLoadingRealtime(false);
		}
	};

	const fetchDashboardSummary = async () => {
		try {
			setIsLoadingSummary(true);
			const summaryData = await adminService.getDashboardSummary({ period: 'today' });
			setSummary(summaryData);
		} catch (err) {
			console.error('Failed to load dashboard summary:', err);
		} finally {
			setIsLoadingSummary(false);
		}
	};

	const fetchRevenueData = async (period?: typeof revenuePeriod, groupBy?: typeof revenueGroupBy) => {
		try {
			setIsLoadingRevenue(true);
			const revenue = await adminService.getRevenueTrend({
				period: period || revenuePeriod,
				group_by: groupBy || revenueGroupBy,
			});
			setRevenueTrend(revenue);
		} catch (err) {
			console.error('Failed to load revenue data:', err);
		} finally {
			setIsLoadingRevenue(false);
		}
	};

	// Smart default: auto-select group_by based on period
	const getDefaultGroupBy = (period: typeof revenuePeriod): typeof revenueGroupBy => {
		switch (period) {
			case 'today':
				return 'hour';
			case '7days':
				return 'day';
			case '30days':
				return 'day';
			case '90days':
				return 'week';
			case 'year':
				return 'month';
			default:
				return 'day';
		}
	};

	// Handle period change with smart groupBy selection
	const handlePeriodChange = (newPeriod: typeof revenuePeriod) => {
		setRevenuePeriod(newPeriod);
		const smartGroupBy = getDefaultGroupBy(newPeriod);
		setRevenueGroupBy(smartGroupBy);
		fetchRevenueData(newPeriod, smartGroupBy);
	};

	// Handle groupBy change
	const handleGroupByChange = (newGroupBy: typeof revenueGroupBy) => {
		setRevenueGroupBy(newGroupBy);
		fetchRevenueData(revenuePeriod, newGroupBy);
	};

	const fetchActionItems = async () => {
		try {
			setIsLoadingActions(true);
			const actions = await adminService.getActionItems();
			setActionItems(actions);
		} catch (err) {
			console.error('Failed to load action items:', err);
		} finally {
			setIsLoadingActions(false);
		}
	};

	useEffect(() => {
		fetchRealtimeMetrics();
		fetchDashboardSummary();
		fetchRevenueData();
		fetchActionItems();

		// Auto-refresh every 30 seconds
		const interval = setInterval(() => {
			fetchRealtimeMetrics();
			fetchDashboardSummary();
		}, 30000);

		return () => clearInterval(interval);
	}, []);

	const handleRefresh = () => {
		fetchRealtimeMetrics();
		fetchDashboardSummary();
		fetchRevenueData();
		fetchActionItems();
		toast.success('Dashboard refreshed');
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(value);
	};

	const formatNumber = (value: number) => {
		return new Intl.NumberFormat('en-US').format(value);
	};

	const formatRelativeTime = (date: Date) => {
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ago`;
	};

	// Mock activity feed (replace when endpoint is ready)
	const mockActivityFeed: ActivityFeedItem[] = [
		{
			id: '1',
			type: 'ride_completed',
			title: 'Ride Completed',
			description: 'Ride #12345 completed successfully',
			timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
		},
		{
			id: '2',
			type: 'driver_approved',
			title: 'Driver Approved',
			description: 'New driver Mike Johnson was approved',
			timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
		},
		{
			id: '3',
			type: 'fraud_alert',
			title: 'Fraud Alert',
			description: 'High-risk activity detected',
			timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
			severity: 'high',
		},
	];

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Dashboard</h1>
					<p className='text-sm text-muted-foreground'>
						Real-time overview of your ride-hailing platform
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<span className='text-xs text-muted-foreground'>
						Updated {formatRelativeTime(lastUpdated)}
					</span>
					<Button variant='outline' size='sm' onClick={handleRefresh}>
						<IconRefresh className='h-4 w-4' />
						Refresh
					</Button>
				</div>
			</div>

			{/* Real-time Metrics Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				{/* Active Rides */}
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCar className='h-4 w-4' />
							Active Rides
						</CardDescription>
						{isLoadingRealtime ? (
							<Skeleton className='h-8 w-24' />
						) : (
							<CardTitle className='text-3xl'>
								{realtimeMetrics?.active_rides || 0}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Currently in progress</p>
					</CardContent>
				</Card>

				{/* Available Drivers */}
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconUsers className='h-4 w-4' />
							Available Drivers
						</CardDescription>
						{isLoadingRealtime ? (
							<Skeleton className='h-8 w-24' />
						) : (
							<CardTitle className='text-3xl'>
								{realtimeMetrics?.available_drivers || 0}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							{realtimeMetrics?.online_drivers || 0} online total
						</p>
					</CardContent>
				</Card>

				{/* Today's Revenue */}
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCurrencyDollar className='h-4 w-4' />
							Today&apos;s Revenue
						</CardDescription>
						{isLoadingRealtime ? (
							<Skeleton className='h-8 w-24' />
						) : (
							<CardTitle className='text-3xl'>
								{formatCurrency(realtimeMetrics?.today_revenue || 0)}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<div className='flex items-center gap-1 text-xs'>
							{realtimeMetrics && realtimeMetrics.today_revenue_change >= 0 ? (
								<>
									<IconTrendingUp className='h-3 w-3 text-green-600' />
									<span className='text-green-600 font-medium'>
										+{realtimeMetrics.today_revenue_change.toFixed(1)}%
									</span>
								</>
							) : (
								<>
									<IconTrendingDown className='h-3 w-3 text-red-600' />
									<span className='text-red-600 font-medium'>
										{realtimeMetrics?.today_revenue_change.toFixed(1)}%
									</span>
								</>
							)}
							<span className='text-muted-foreground'>vs yesterday</span>
						</div>
					</CardContent>
				</Card>

				{/* Pending Requests */}
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconClock className='h-4 w-4' />
							Pending Requests
						</CardDescription>
						{isLoadingRealtime ? (
							<Skeleton className='h-8 w-24' />
						) : (
							<CardTitle className='text-3xl'>
								{realtimeMetrics?.pending_requests || 0}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							Avg wait: {realtimeMetrics?.avg_wait_time.toFixed(1) || 0}m
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Summary Metrics Grid */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				{/* Total Rides Today */}
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription>Rides Today</CardDescription>
						{isLoadingSummary ? (
							<Skeleton className='h-7 w-20' />
						) : (
							<CardTitle className='text-2xl'>
								{formatNumber(summary?.rides.total || 0)}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							{summary?.rides.completed || 0} completed,{' '}
							{summary?.rides.in_progress || 0} active
						</p>
					</CardContent>
				</Card>

				{/* Completion Rate */}
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription>Completion Rate</CardDescription>
						{isLoadingSummary ? (
							<Skeleton className='h-7 w-20' />
						) : (
							<CardTitle className='text-2xl'>
								{summary?.rides.completion_rate.toFixed(1) || 0}%
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							{summary?.rides.cancelled || 0} cancelled (
							{summary?.rides.cancellation_rate.toFixed(1) || 0}%)
						</p>
					</CardContent>
				</Card>

				{/* Active Riders */}
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription>Active Riders</CardDescription>
						{isLoadingSummary ? (
							<Skeleton className='h-7 w-20' />
						) : (
							<CardTitle className='text-2xl'>
								{formatNumber(summary?.riders.active_today || 0)}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							{summary?.riders.new_signups || 0} new signups
						</p>
					</CardContent>
				</Card>

				{/* Driver Stats */}
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription>Driver Utilization</CardDescription>
						{isLoadingSummary ? (
							<Skeleton className='h-7 w-20' />
						) : (
							<CardTitle className='text-2xl'>
								{summary?.drivers.utilization_rate.toFixed(1) || 0}%
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							Avg rating: {summary?.drivers.avg_rating.toFixed(1) || 0} ⭐
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Revenue Trend Chart */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle>Revenue Trend</CardTitle>
							<CardDescription>
								Total: {revenueTrend && formatCurrency(revenueTrend.total_revenue)}
								{revenueTrend && revenueTrend.avg_daily_revenue > 0 && (
									<> • Avg: {formatCurrency(revenueTrend.avg_daily_revenue)}/day</>
								)}
							</CardDescription>
						</div>
						<div className='flex gap-2'>
							{/* Period Tabs */}
							<Tabs value={revenuePeriod} onValueChange={(v) => handlePeriodChange(v as typeof revenuePeriod)}>
								<TabsList>
									<TabsTrigger value='today'>Today</TabsTrigger>
									<TabsTrigger value='7days'>7 Days</TabsTrigger>
									<TabsTrigger value='30days'>30 Days</TabsTrigger>
									<TabsTrigger value='90days'>90 Days</TabsTrigger>
									<TabsTrigger value='year'>1 Year</TabsTrigger>
								</TabsList>
							</Tabs>
							{/* Group By Tabs */}
							<Tabs value={revenueGroupBy} onValueChange={(v) => handleGroupByChange(v as typeof revenueGroupBy)}>
								<TabsList>
									<TabsTrigger value='hour'>Hourly</TabsTrigger>
									<TabsTrigger value='day'>Daily</TabsTrigger>
									<TabsTrigger value='week'>Weekly</TabsTrigger>
									<TabsTrigger value='month'>Monthly</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoadingRevenue ? (
						<Skeleton className='h-75 w-full' />
					) : revenueTrend && revenueTrend.trend.length > 0 ? (
						<ResponsiveContainer width='100%' height={300}>
							<AreaChart data={revenueTrend.trend}>
								<defs>
									<linearGradient id='colorRevenue' x1='0' y1='0' x2='0' y2='1'>
										<stop offset='5%' stopColor='hsl(var(--primary))' stopOpacity={0.3} />
										<stop offset='95%' stopColor='hsl(var(--primary))' stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
								<XAxis
									dataKey='date'
									className='text-xs'
									tickFormatter={(value) => {
										const date = new Date(value);
										return date.toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
										});
									}}
								/>
								<YAxis className='text-xs' tickFormatter={(value) => `$${value}`} />
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length) {
											const data = payload[0].payload;
											return (
												<div className='rounded-lg border bg-background p-2 shadow-sm'>
													<div className='grid gap-2'>
														<div className='flex flex-col'>
															<span className='text-[0.70rem] uppercase text-muted-foreground'>
																Date
															</span>
															<span className='font-bold text-sm'>
																{new Date(data.date).toLocaleDateString('en-US', {
																	month: 'short',
																	day: 'numeric',
																	year: 'numeric',
																})}
															</span>
														</div>
														<div className='flex flex-col'>
															<span className='text-[0.70rem] uppercase text-muted-foreground'>
																Revenue
															</span>
															<span className='font-bold text-sm text-primary'>
																{formatCurrency(data.revenue)}
															</span>
														</div>
														<div className='flex flex-col'>
															<span className='text-[0.70rem] uppercase text-muted-foreground'>
																Rides
															</span>
															<span className='font-bold text-sm'>{data.rides}</span>
														</div>
														<div className='flex flex-col'>
															<span className='text-[0.70rem] uppercase text-muted-foreground'>
																Avg Fare
															</span>
															<span className='font-bold text-sm'>
																{formatCurrency(data.avg_fare)}
															</span>
														</div>
													</div>
												</div>
											);
										}
										return null;
									}}
								/>
								<Area
									type='monotone'
									dataKey='revenue'
									stroke='hsl(var(--primary))'
									fill='url(#colorRevenue)'
									strokeWidth={2}
								/>
							</AreaChart>
						</ResponsiveContainer>
					) : (
						<div className='flex h-75 items-center justify-center text-sm text-muted-foreground'>
							No revenue data available
						</div>
					)}
				</CardContent>
			</Card>

			{/* Bottom Grid: Action Items & Recent Activity */}
			<div className='grid gap-4 md:grid-cols-2'>
				{/* Action Items */}
				<Card>
					<CardHeader>
						<CardTitle>Action Items</CardTitle>
						<CardDescription>Items requiring your attention</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						{isLoadingActions ? (
							<>
								<Skeleton className='h-16 w-full' />
								<Skeleton className='h-16 w-full' />
								<Skeleton className='h-16 w-full' />
							</>
						) : (
							<>
								{/* Pending Driver Approvals */}
								<Link href='/dashboard/drivers'>
									<div className='flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors'>
										<div className='flex items-center gap-3'>
											<div className='rounded-full bg-blue-100 p-2 dark:bg-blue-900'>
												<IconUsers className='h-4 w-4 text-blue-600 dark:text-blue-400' />
											</div>
											<div>
												<p className='text-sm font-medium'>Pending Driver Approvals</p>
												<p className='text-xs text-muted-foreground'>
													{actionItems?.pending_driver_approvals?.count || 0} drivers waiting
													{(actionItems?.pending_driver_approvals?.urgent_count ?? 0) > 0 &&
														` (${actionItems?.pending_driver_approvals?.urgent_count} urgent)`}
												</p>
											</div>
										</div>
										<div className='flex items-center gap-2'>
											<Badge variant='secondary'>
												{actionItems?.pending_driver_approvals?.count || 0}
											</Badge>
											<IconArrowRight className='h-4 w-4 text-muted-foreground' />
										</div>
									</div>
								</Link>

								{/* Fraud Alerts */}
								<div className='flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors'>
									<div className='flex items-center gap-3'>
										<div className='rounded-full bg-red-100 p-2 dark:bg-red-900'>
											<IconAlertTriangle className='h-4 w-4 text-red-600 dark:text-red-400' />
										</div>
										<div>
											<p className='text-sm font-medium'>Fraud Alerts</p>
											<p className='text-xs text-muted-foreground'>
												{actionItems?.fraud_alerts?.count || 0} alerts
												{(actionItems?.fraud_alerts?.critical_count ?? 0) > 0 &&
													` (${actionItems?.fraud_alerts?.critical_count} critical)`}
											</p>
										</div>
									</div>
									<div className='flex items-center gap-2'>
										<Badge variant='destructive'>
											{actionItems?.fraud_alerts?.count || 0}
										</Badge>
										<IconArrowRight className='h-4 w-4 text-muted-foreground' />
									</div>
								</div>

								{/* Negative Feedback */}
								{(actionItems?.negative_feedback?.count ?? 0) > 0 && (
									<div className='flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors'>
										<div className='flex items-center gap-3'>
											<div className='rounded-full bg-orange-100 p-2 dark:bg-orange-900'>
												<IconAlertTriangle className='h-4 w-4 text-orange-600 dark:text-orange-400' />
											</div>
											<div>
												<p className='text-sm font-medium'>Negative Feedback</p>
												<p className='text-xs text-muted-foreground'>
													{actionItems?.negative_feedback?.count} low ratings (
													{actionItems?.negative_feedback?.one_star_count} one-star)
												</p>
											</div>
										</div>
										<div className='flex items-center gap-2'>
											<Badge variant='outline'>
												{actionItems?.negative_feedback?.count}
											</Badge>
											<IconArrowRight className='h-4 w-4 text-muted-foreground' />
										</div>
									</div>
								)}
							</>
						)}
					</CardContent>
				</Card>

				{/* Recent Activity */}
				<Card>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
						<CardDescription>Latest events in the system</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3'>
						{mockActivityFeed.map((activity) => (
							<div key={activity.id} className='flex items-start gap-3 rounded-lg border p-3'>
								<div className='mt-0.5'>
									{activity.type === 'ride_completed' && (
										<div className='rounded-full bg-green-100 p-1.5 dark:bg-green-900'>
											<IconCar className='h-3 w-3 text-green-600 dark:text-green-400' />
										</div>
									)}
									{activity.type === 'driver_approved' && (
										<div className='rounded-full bg-blue-100 p-1.5 dark:bg-blue-900'>
											<IconUsers className='h-3 w-3 text-blue-600 dark:text-blue-400' />
										</div>
									)}
									{activity.type === 'fraud_alert' && (
										<div className='rounded-full bg-red-100 p-1.5 dark:bg-red-900'>
											<IconAlertTriangle className='h-3 w-3 text-red-600 dark:text-red-400' />
										</div>
									)}
								</div>
								<div className='flex-1 space-y-1'>
									<div className='flex items-center justify-between'>
										<p className='text-sm font-medium'>{activity.title}</p>
										{activity.severity && (
											<Badge
												variant={
													activity.severity === 'high' || activity.severity === 'critical'
														? 'destructive'
														: 'secondary'
												}
												className='text-xs'
											>
												{activity.severity}
											</Badge>
										)}
									</div>
									<p className='text-xs text-muted-foreground'>{activity.description}</p>
									<p className='text-xs text-muted-foreground flex items-center gap-1'>
										<IconClock className='h-3 w-3' />
										{formatRelativeTime(new Date(activity.timestamp))}
									</p>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
