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
	IconUserCheck,
	IconSteeringWheel,
	IconCreditCard,
	IconWallet,
	IconCash,
	IconFileAlert,
	IconAlertCircle,
	IconChartPie,
	IconActivity,
	IconCheck,
	IconX,
	IconShieldCheck,
	IconTag,
	IconStar,
} from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import {
	RealtimeMetrics,
	DashboardSummary,
	RevenueTrend,
	DashboardStats,
	ActivityFeedItem,
} from '@/lib/types/models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from 'recharts';

// Payment method colors for charts
const PAYMENT_COLORS = {
	card: '#3b82f6',
	wallet: '#8b5cf6',
	cash: '#22c55e',
};

export default function DashboardPage() {
	// Base dashboard stats
	const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
	const [isLoadingStats, setIsLoadingStats] = useState(true);

	// Realtime metrics
	const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);
	const [isLoadingRealtime, setIsLoadingRealtime] = useState(true);

	// Summary
	const [summary, setSummary] = useState<DashboardSummary | null>(null);
	const [isLoadingSummary, setIsLoadingSummary] = useState(true);
	const [summaryPeriod, setSummaryPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

	// Revenue trend
	const [revenueTrend, setRevenueTrend] = useState<RevenueTrend | null>(null);
	const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);
	const [revenuePeriod, setRevenuePeriod] = useState<'today' | '7days' | '30days' | '90days' | 'year'>('7days');
	const [revenueGroupBy, setRevenueGroupBy] = useState<'hour' | 'day' | 'week' | 'month'>('day');

	// Action items
	const [actionItems, setActionItems] = useState<Awaited<ReturnType<typeof adminService.getActionItems>> | null>(null);
	const [isLoadingActions, setIsLoadingActions] = useState(true);

	// Activity feed
	const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
	const [isLoadingActivity, setIsLoadingActivity] = useState(true);

	// Last updated timestamp
	const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

	// Fetch base dashboard stats
	const fetchDashboardStats = async () => {
		try {
			setIsLoadingStats(true);
			const stats = await adminService.getDashboard();
			setDashboardStats(stats);
		} catch (err) {
			console.error('Failed to load dashboard stats:', err);
		} finally {
			setIsLoadingStats(false);
		}
	};

	// Fetch realtime metrics
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

	// Fetch dashboard summary
	const fetchDashboardSummary = async (period?: typeof summaryPeriod) => {
		try {
			setIsLoadingSummary(true);
			const summaryData = await adminService.getDashboardSummary({ period: period || summaryPeriod });
			setSummary(summaryData);
		} catch (err) {
			console.error('Failed to load dashboard summary:', err);
		} finally {
			setIsLoadingSummary(false);
		}
	};

	// Fetch revenue data
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

	// Fetch action items
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

	// Fetch activity feed
	const fetchActivityFeed = async () => {
		try {
			setIsLoadingActivity(true);
			const response = await adminService.getActivityFeed({ limit: 10 });
			setActivityFeed(Array.isArray(response?.data) ? response.data : []);
		} catch (err) {
			console.error('Failed to load activity feed:', err);
		} finally {
			setIsLoadingActivity(false);
		}
	};

	// Smart default: auto-select group_by based on period
	const getDefaultGroupBy = (period: typeof revenuePeriod): typeof revenueGroupBy => {
		switch (period) {
			case 'today': return 'hour';
			case '7days': return 'day';
			case '30days': return 'day';
			case '90days': return 'week';
			case 'year': return 'month';
			default: return 'day';
		}
	};

	// Handle revenue period change
	const handleRevenuePeriodChange = (newPeriod: typeof revenuePeriod) => {
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

	// Handle summary period change
	const handleSummaryPeriodChange = (newPeriod: typeof summaryPeriod) => {
		setSummaryPeriod(newPeriod);
		fetchDashboardSummary(newPeriod);
	};

	// Initial data fetch
	useEffect(() => {
		fetchDashboardStats();
		fetchRealtimeMetrics();
		fetchDashboardSummary();
		fetchRevenueData();
		fetchActionItems();
		fetchActivityFeed();

		// Auto-refresh realtime data every 30 seconds
		const interval = setInterval(() => {
			fetchRealtimeMetrics();
		}, 30000);

		return () => clearInterval(interval);
	}, []);

	// Refresh all data
	const handleRefresh = () => {
		fetchDashboardStats();
		fetchRealtimeMetrics();
		fetchDashboardSummary();
		fetchRevenueData();
		fetchActionItems();
		fetchActivityFeed();
		toast.success('Dashboard refreshed');
	};

	// Formatting helpers
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(value);
	};

	const formatNumber = (value: number) => {
		return new Intl.NumberFormat('en-US').format(value);
	};

	const formatPercent = (value: number) => {
		return `${value.toFixed(1)}%`;
	};

	const formatRelativeTime = (date: Date) => {
		const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
		if (seconds < 60) return 'just now';
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ago`;
	};

	// Calculate total action items count
	const totalActionItems =
		(actionItems?.pending_driver_approvals?.count || 0) +
		(actionItems?.fraud_alerts?.count || 0) +
		(actionItems?.negative_feedback?.count || 0) +
		(actionItems?.low_balance_drivers?.count || 0) +
		(actionItems?.expired_documents?.count || 0);

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

			{/* Real-time Metrics Row */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				{/* Active Rides */}
				<Card className='border-l-4 border-l-blue-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCar className='h-4 w-4' />
							Active Rides
						</CardDescription>
						{isLoadingRealtime ? (
							<Skeleton className='h-8 w-24' />
						) : (
							<CardTitle className='text-3xl'>{Number(realtimeMetrics?.active_rides) || 0}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							{Number(realtimeMetrics?.pending_requests) || 0} pending requests
						</p>
					</CardContent>
				</Card>

				{/* Available Drivers */}
				<Card className='border-l-4 border-l-green-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconSteeringWheel className='h-4 w-4' />
							Available Drivers
						</CardDescription>
						{isLoadingRealtime ? (
							<Skeleton className='h-8 w-24' />
						) : (
							<CardTitle className='text-3xl'>{Number(realtimeMetrics?.available_drivers) || 0}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							{Number(realtimeMetrics?.online_drivers) || 0} online total
						</p>
					</CardContent>
				</Card>

				{/* Today's Revenue */}
				<Card className='border-l-4 border-l-yellow-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCurrencyDollar className='h-4 w-4' />
							Today&apos;s Revenue
						</CardDescription>
						{isLoadingRealtime ? (
							<Skeleton className='h-8 w-24' />
						) : (
							<CardTitle className='text-3xl'>
								{formatCurrency(Number(realtimeMetrics?.today_revenue) || 0)}
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

				{/* Avg Wait Time */}
				<Card className='border-l-4 border-l-purple-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconClock className='h-4 w-4' />
							Avg Wait Time
						</CardDescription>
						{isLoadingRealtime ? (
							<Skeleton className='h-8 w-24' />
						) : (
							<CardTitle className='text-3xl'>
								{(realtimeMetrics?.avg_wait_time ?? 0).toFixed(1)}m
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							Avg ETA: {(realtimeMetrics?.avg_eta ?? 0).toFixed(1)} min
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Overview Stats Row */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				{/* Total Users */}
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconUsers className='h-4 w-4' />
							Total Users
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-7 w-20' />
						) : (
							<CardTitle className='text-2xl'>
								{formatNumber(Number(dashboardStats?.users?.total_users) || 0)}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<div className='flex gap-3 text-xs text-muted-foreground'>
							<span>{dashboardStats?.users?.total_riders || 0} riders</span>
							<span>{dashboardStats?.users?.total_drivers || 0} drivers</span>
						</div>
					</CardContent>
				</Card>

				{/* Total Rides */}
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCar className='h-4 w-4' />
							Total Rides
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-7 w-20' />
						) : (
							<CardTitle className='text-2xl'>
								{formatNumber(Number(dashboardStats?.rides?.total_rides) || 0)}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							{dashboardStats?.rides?.completed_rides || 0} completed
						</p>
					</CardContent>
				</Card>

				{/* Total Revenue */}
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCurrencyDollar className='h-4 w-4' />
							Total Revenue
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-7 w-20' />
						) : (
							<CardTitle className='text-2xl'>
								{formatCurrency(Number(dashboardStats?.rides?.total_revenue) || 0)}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							Avg fare: {formatCurrency(dashboardStats?.rides?.avg_fare || 0)}
						</p>
					</CardContent>
				</Card>

				{/* Today's Rides */}
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconClock className='h-4 w-4' />
							Today&apos;s Rides
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-7 w-20' />
						) : (
							<CardTitle className='text-2xl'>
								{formatNumber(Number(dashboardStats?.today_rides?.total_rides) || 0)}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>
							{dashboardStats?.today_rides?.completed_rides || 0} completed,{' '}
							{dashboardStats?.today_rides?.active_rides || 0} active
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Summary Period Selector & Detailed Stats */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div>
							<CardTitle>Performance Summary</CardTitle>
							<CardDescription>Detailed metrics for the selected period</CardDescription>
						</div>
						<Tabs value={summaryPeriod} onValueChange={(v) => handleSummaryPeriodChange(v as typeof summaryPeriod)}>
							<TabsList>
								<TabsTrigger value='today'>Today</TabsTrigger>
								<TabsTrigger value='week'>This Week</TabsTrigger>
								<TabsTrigger value='month'>This Month</TabsTrigger>
								<TabsTrigger value='all'>All Time</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>
				</CardHeader>
				<CardContent>
					{isLoadingSummary ? (
						<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
							{[...Array(4)].map((_, i) => (
								<Skeleton key={i} className='h-32 w-full' />
							))}
						</div>
					) : (
						<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
							{/* Rides Summary */}
							<div className='space-y-3'>
								<div className='flex items-center gap-2'>
									<IconCar className='h-5 w-5 text-blue-500' />
									<h4 className='font-semibold'>Rides</h4>
								</div>
								<div className='space-y-2'>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Total</span>
										<span className='font-medium'>{summary?.rides?.total || 0}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Completed</span>
										<span className='font-medium text-green-600'>{summary?.rides?.completed || 0}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Cancelled</span>
										<span className='font-medium text-red-600'>{summary?.rides?.cancelled || 0}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Completion Rate</span>
										<span className='font-medium'>{formatPercent(summary?.rides?.completion_rate || 0)}</span>
									</div>
									<Progress value={summary?.rides?.completion_rate || 0} className='h-2' />
								</div>
							</div>

							{/* Drivers Summary */}
							<div className='space-y-3'>
								<div className='flex items-center gap-2'>
									<IconSteeringWheel className='h-5 w-5 text-green-500' />
									<h4 className='font-semibold'>Drivers</h4>
								</div>
								<div className='space-y-2'>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Active</span>
										<span className='font-medium'>{summary?.drivers?.total_active || 0}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Online Now</span>
										<span className='font-medium text-green-600'>{summary?.drivers?.online_now || 0}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Pending Approvals</span>
										<span className='font-medium text-yellow-600'>{summary?.drivers?.pending_approvals || 0}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Avg Rating</span>
										<span className='font-medium'>{summary?.drivers?.avg_rating?.toFixed(1) || 0} ⭐</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Utilization</span>
										<span className='font-medium'>{formatPercent(summary?.drivers?.utilization_rate || 0)}</span>
									</div>
								</div>
							</div>

							{/* Riders Summary */}
							<div className='space-y-3'>
								<div className='flex items-center gap-2'>
									<IconUsers className='h-5 w-5 text-purple-500' />
									<h4 className='font-semibold'>Riders</h4>
								</div>
								<div className='space-y-2'>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Total Active</span>
										<span className='font-medium'>{summary?.riders?.total_active || 0}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Active Today</span>
										<span className='font-medium text-green-600'>{summary?.riders?.active_today || 0}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>New Signups</span>
										<span className='font-medium text-blue-600'>{summary?.riders?.new_signups || 0}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Retention Rate</span>
										<span className='font-medium'>{formatPercent(summary?.riders?.retention_rate || 0)}</span>
									</div>
									<Progress value={summary?.riders?.retention_rate || 0} className='h-2' />
								</div>
							</div>

							{/* Revenue Summary */}
							<div className='space-y-3'>
								<div className='flex items-center gap-2'>
									<IconCurrencyDollar className='h-5 w-5 text-yellow-500' />
									<h4 className='font-semibold'>Revenue</h4>
								</div>
								<div className='space-y-2'>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Total</span>
										<span className='font-medium'>{formatCurrency(summary?.revenue?.total || 0)}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Commission</span>
										<span className='font-medium text-green-600'>{formatCurrency(summary?.revenue?.commission || 0)}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Driver Earnings</span>
										<span className='font-medium'>{formatCurrency(summary?.revenue?.driver_earnings || 0)}</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-sm text-muted-foreground'>Avg Fare</span>
										<span className='font-medium'>{formatCurrency(summary?.revenue?.avg_fare || 0)}</span>
									</div>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Charts Row */}
			<div className='grid gap-4 lg:grid-cols-3'>
				{/* Revenue Trend Chart - Takes 2 columns */}
				<Card className='lg:col-span-2'>
					<CardHeader>
						<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
							<div>
								<CardTitle>Revenue Trend</CardTitle>
								<CardDescription>
									Total: {revenueTrend && formatCurrency(revenueTrend.total_revenue)}
									{revenueTrend && revenueTrend.avg_daily_revenue > 0 && (
										<> • Avg: {formatCurrency(revenueTrend.avg_daily_revenue)}/day</>
									)}
								</CardDescription>
							</div>
							<div className='flex flex-wrap gap-2'>
								<Tabs value={revenuePeriod} onValueChange={(v) => handleRevenuePeriodChange(v as typeof revenuePeriod)}>
									<TabsList className='h-8'>
										<TabsTrigger value='today' className='text-xs px-2'>Today</TabsTrigger>
										<TabsTrigger value='7days' className='text-xs px-2'>7D</TabsTrigger>
										<TabsTrigger value='30days' className='text-xs px-2'>30D</TabsTrigger>
										<TabsTrigger value='90days' className='text-xs px-2'>90D</TabsTrigger>
										<TabsTrigger value='year' className='text-xs px-2'>1Y</TabsTrigger>
									</TabsList>
								</Tabs>
								<Tabs value={revenueGroupBy} onValueChange={(v) => handleGroupByChange(v as typeof revenueGroupBy)}>
									<TabsList className='h-8'>
										<TabsTrigger value='hour' className='text-xs px-2'>Hour</TabsTrigger>
										<TabsTrigger value='day' className='text-xs px-2'>Day</TabsTrigger>
										<TabsTrigger value='week' className='text-xs px-2'>Week</TabsTrigger>
										<TabsTrigger value='month' className='text-xs px-2'>Month</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{isLoadingRevenue ? (
							<Skeleton className='h-64 w-full' />
						) : revenueTrend && revenueTrend.trend.length > 0 ? (
							<ResponsiveContainer width='100%' height={256}>
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
											if (revenueGroupBy === 'hour') {
												return date.toLocaleTimeString('en-US', { hour: 'numeric' });
											}
											return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
																<span className='text-[0.70rem] uppercase text-muted-foreground'>Date</span>
																<span className='font-bold text-sm'>
																	{new Date(data.date).toLocaleDateString('en-US', {
																		month: 'short',
																		day: 'numeric',
																		year: 'numeric',
																	})}
																</span>
															</div>
															<div className='flex flex-col'>
																<span className='text-[0.70rem] uppercase text-muted-foreground'>Revenue</span>
																<span className='font-bold text-sm text-primary'>{formatCurrency(data.revenue)}</span>
															</div>
															<div className='flex flex-col'>
																<span className='text-[0.70rem] uppercase text-muted-foreground'>Rides</span>
																<span className='font-bold text-sm'>{data.rides}</span>
															</div>
															<div className='flex flex-col'>
																<span className='text-[0.70rem] uppercase text-muted-foreground'>Commission</span>
																<span className='font-bold text-sm text-green-600'>{formatCurrency(data.commission)}</span>
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
							<div className='flex h-64 items-center justify-center text-sm text-muted-foreground'>
								No revenue data available
							</div>
						)}
					</CardContent>
				</Card>

				{/* Payment Methods Breakdown */}
				<Card>
					<CardHeader>
						<div className='flex items-center gap-2'>
							<IconChartPie className='h-5 w-5' />
							<div>
								<CardTitle className='text-base'>Payment Methods</CardTitle>
								<CardDescription>Revenue by payment type</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{isLoadingSummary ? (
							<Skeleton className='h-48 w-full' />
						) : summary?.revenue?.by_payment_method && summary.revenue.by_payment_method.length > 0 ? (
							<div className='space-y-4'>
								<ResponsiveContainer width='100%' height={160}>
									<PieChart>
										<Pie
											data={summary.revenue.by_payment_method}
											dataKey='amount'
											nameKey='method'
											cx='50%'
											cy='50%'
											innerRadius={40}
											outerRadius={70}
											paddingAngle={2}
										>
											{summary.revenue.by_payment_method.map((entry) => (
												<Cell
													key={entry.method}
													fill={PAYMENT_COLORS[entry.method as keyof typeof PAYMENT_COLORS] || '#888'}
												/>
											))}
										</Pie>
										<Tooltip
											formatter={(value: number) => formatCurrency(value)}
											labelFormatter={(label) => label.charAt(0).toUpperCase() + label.slice(1)}
										/>
									</PieChart>
								</ResponsiveContainer>
								<div className='space-y-2'>
									{summary.revenue.by_payment_method.map((pm) => (
										<div key={pm.method} className='flex items-center justify-between'>
											<div className='flex items-center gap-2'>
												{pm.method === 'card' && <IconCreditCard className='h-4 w-4 text-blue-500' />}
												{pm.method === 'wallet' && <IconWallet className='h-4 w-4 text-purple-500' />}
												{pm.method === 'cash' && <IconCash className='h-4 w-4 text-green-500' />}
												<span className='text-sm capitalize'>{pm.method}</span>
											</div>
											<div className='text-right'>
												<span className='text-sm font-medium'>{formatCurrency(pm.amount)}</span>
												<span className='text-xs text-muted-foreground ml-2'>({pm.percentage.toFixed(1)}%)</span>
											</div>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className='flex h-48 items-center justify-center text-sm text-muted-foreground'>
								No payment data available
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Action Items & Alerts */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<CardTitle>Action Items</CardTitle>
							{totalActionItems > 0 && (
								<Badge variant='destructive'>{totalActionItems}</Badge>
							)}
						</div>
						<CardDescription>Items requiring your attention</CardDescription>
					</div>
				</CardHeader>
				<CardContent>
					{isLoadingActions ? (
						<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className='h-20 w-full' />
							))}
						</div>
					) : (
						<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
							{/* Pending Driver Approvals */}
							<Link href='/dashboard/drivers?status=pending'>
								<div className='flex items-center justify-between rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors'>
									<div className='flex items-center gap-3'>
										<div className='rounded-full bg-blue-100 p-2 dark:bg-blue-900'>
											<IconUserCheck className='h-5 w-5 text-blue-600 dark:text-blue-400' />
										</div>
										<div>
											<p className='font-medium'>Driver Approvals</p>
											<p className='text-sm text-muted-foreground'>
												{actionItems?.pending_driver_approvals?.count || 0} pending
												{(actionItems?.pending_driver_approvals?.urgent_count ?? 0) > 0 && (
													<span className='text-red-600'> ({actionItems?.pending_driver_approvals?.urgent_count} urgent)</span>
												)}
											</p>
										</div>
									</div>
									<div className='flex items-center gap-2'>
										<Badge variant={(actionItems?.pending_driver_approvals?.count || 0) > 0 ? 'default' : 'secondary'}>
											{actionItems?.pending_driver_approvals?.count || 0}
										</Badge>
										<IconArrowRight className='h-4 w-4 text-muted-foreground' />
									</div>
								</div>
							</Link>

							{/* Fraud Alerts */}
							<Link href='/dashboard/fraud' className='flex items-center justify-between rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors'>
								<div className='flex items-center gap-3'>
									<div className='rounded-full bg-red-100 p-2 dark:bg-red-900'>
										<IconAlertTriangle className='h-5 w-5 text-red-600 dark:text-red-400' />
									</div>
									<div>
										<p className='font-medium'>Fraud Alerts</p>
										<p className='text-sm text-muted-foreground'>
											{actionItems?.fraud_alerts?.count || 0} alerts
											{(actionItems?.fraud_alerts?.critical_count ?? 0) > 0 && (
												<span className='text-red-600'> ({actionItems?.fraud_alerts?.critical_count} critical)</span>
											)}
										</p>
									</div>
								</div>
								<div className='flex items-center gap-2'>
									<Badge variant={(actionItems?.fraud_alerts?.count || 0) > 0 ? 'destructive' : 'secondary'}>
										{actionItems?.fraud_alerts?.count || 0}
									</Badge>
									<IconArrowRight className='h-4 w-4 text-muted-foreground' />
								</div>
							</Link>

							{/* Negative Feedback */}
							<Link href='/dashboard/rides' className='flex items-center justify-between rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors'>
								<div className='flex items-center gap-3'>
									<div className='rounded-full bg-orange-100 p-2 dark:bg-orange-900'>
										<IconAlertCircle className='h-5 w-5 text-orange-600 dark:text-orange-400' />
									</div>
									<div>
										<p className='font-medium'>Negative Feedback</p>
										<p className='text-sm text-muted-foreground'>
											{actionItems?.negative_feedback?.count || 0} reviews
											{(actionItems?.negative_feedback?.one_star_count ?? 0) > 0 && (
												<span className='text-red-600'> ({actionItems?.negative_feedback?.one_star_count} 1-star)</span>
											)}
										</p>
									</div>
								</div>
								<div className='flex items-center gap-2'>
									<Badge variant={(actionItems?.negative_feedback?.count || 0) > 0 ? 'outline' : 'secondary'}>
										{actionItems?.negative_feedback?.count || 0}
									</Badge>
									<IconArrowRight className='h-4 w-4 text-muted-foreground' />
								</div>
							</Link>

							{/* Low Balance Drivers */}
							<Link href='/dashboard/drivers'>
								<div className='flex items-center justify-between rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors'>
									<div className='flex items-center gap-3'>
										<div className='rounded-full bg-yellow-100 p-2 dark:bg-yellow-900'>
											<IconWallet className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
										</div>
										<div>
											<p className='font-medium'>Low Balance Drivers</p>
											<p className='text-sm text-muted-foreground'>
												{actionItems?.low_balance_drivers?.count || 0} drivers
											</p>
										</div>
									</div>
									<div className='flex items-center gap-2'>
										<Badge variant={(actionItems?.low_balance_drivers?.count || 0) > 0 ? 'outline' : 'secondary'}>
											{actionItems?.low_balance_drivers?.count || 0}
										</Badge>
										<IconArrowRight className='h-4 w-4 text-muted-foreground' />
									</div>
								</div>
							</Link>

							{/* Expired Documents */}
							<Link href='/dashboard/drivers'>
								<div className='flex items-center justify-between rounded-lg border p-4 hover:bg-accent cursor-pointer transition-colors'>
									<div className='flex items-center gap-3'>
										<div className='rounded-full bg-purple-100 p-2 dark:bg-purple-900'>
											<IconFileAlert className='h-5 w-5 text-purple-600 dark:text-purple-400' />
										</div>
										<div>
											<p className='font-medium'>Expired Documents</p>
											<p className='text-sm text-muted-foreground'>
												{actionItems?.expired_documents?.count || 0} documents
											</p>
										</div>
									</div>
									<div className='flex items-center gap-2'>
										<Badge variant={(actionItems?.expired_documents?.count || 0) > 0 ? 'outline' : 'secondary'}>
											{actionItems?.expired_documents?.count || 0}
										</Badge>
										<IconArrowRight className='h-4 w-4 text-muted-foreground' />
									</div>
								</div>
							</Link>

							{/* System Alerts from Summary */}
							{summary?.alerts && (summary.alerts.fraud_alerts > 0 || summary.alerts.critical_alerts > 0) && (
								<div className='flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950'>
									<div className='flex items-center gap-3'>
										<div className='rounded-full bg-red-200 p-2 dark:bg-red-800'>
											<IconAlertTriangle className='h-5 w-5 text-red-700 dark:text-red-300' />
										</div>
										<div>
											<p className='font-medium text-red-900 dark:text-red-100'>System Alerts</p>
											<p className='text-sm text-red-700 dark:text-red-300'>
												{summary.alerts.critical_alerts} critical, {summary.alerts.fraud_alerts} fraud
											</p>
										</div>
									</div>
									<Badge variant='destructive'>
										{summary.alerts.critical_alerts + summary.alerts.fraud_alerts}
									</Badge>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Recent Activity Feed */}
			<Card>
				<CardHeader>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-2'>
							<IconActivity className='h-5 w-5' />
							<CardTitle>Recent Activity</CardTitle>
						</div>
						<CardDescription>Latest platform events</CardDescription>
					</div>
				</CardHeader>
				<CardContent>
					{isLoadingActivity ? (
						<div className='space-y-3'>
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className='h-12 w-full' />
							))}
						</div>
					) : activityFeed.length > 0 ? (
						<div className='space-y-3'>
							{activityFeed.map((item) => {
								const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
									ride_completed: { icon: <IconCheck className='h-4 w-4' />, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' },
									ride_cancelled: { icon: <IconX className='h-4 w-4' />, color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' },
									driver_approved: { icon: <IconUserCheck className='h-4 w-4' />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' },
									driver_rejected: { icon: <IconX className='h-4 w-4' />, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400' },
									fraud_alert: { icon: <IconShieldCheck className='h-4 w-4' />, color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' },
									user_suspended: { icon: <IconAlertTriangle className='h-4 w-4' />, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' },
									user_activated: { icon: <IconUserCheck className='h-4 w-4' />, color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' },
									promo_redeemed: { icon: <IconTag className='h-4 w-4' />, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400' },
									payment_failed: { icon: <IconCreditCard className='h-4 w-4' />, color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' },
									high_value_ride: { icon: <IconStar className='h-4 w-4' />, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' },
								};
								const style = iconMap[item.type] || { icon: <IconActivity className='h-4 w-4' />, color: 'bg-muted text-muted-foreground' };
								return (
									<div key={item.id} className='flex items-start gap-3 rounded-lg border p-3'>
										<div className={`mt-0.5 rounded-full p-1.5 ${style.color}`}>
											{style.icon}
										</div>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium'>{item.title}</p>
											<p className='text-xs text-muted-foreground truncate'>{item.description}</p>
										</div>
										<div className='flex items-center gap-2 shrink-0'>
											{item.severity && (
												<Badge
													variant={item.severity === 'critical' || item.severity === 'high' ? 'destructive' : 'secondary'}
													className='text-[10px] px-1.5 py-0'
												>
													{item.severity}
												</Badge>
											)}
											<span className='text-xs text-muted-foreground whitespace-nowrap'>
												{formatRelativeTime(new Date(item.timestamp))}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className='flex flex-col items-center justify-center py-8 text-center'>
							<IconActivity className='h-8 w-8 text-muted-foreground mb-2' />
							<p className='text-sm text-muted-foreground'>No recent activity</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Quick Links */}
			<div className='grid gap-4 md:grid-cols-4'>
				<Link href='/dashboard/rides'>
					<Card className='hover:bg-accent cursor-pointer transition-colors'>
						<CardContent className='flex items-center gap-3 p-4'>
							<IconCar className='h-5 w-5 text-blue-500' />
							<span className='font-medium'>View All Rides</span>
							<IconArrowRight className='h-4 w-4 ml-auto text-muted-foreground' />
						</CardContent>
					</Card>
				</Link>
				<Link href='/dashboard/drivers'>
					<Card className='hover:bg-accent cursor-pointer transition-colors'>
						<CardContent className='flex items-center gap-3 p-4'>
							<IconSteeringWheel className='h-5 w-5 text-green-500' />
							<span className='font-medium'>Manage Drivers</span>
							<IconArrowRight className='h-4 w-4 ml-auto text-muted-foreground' />
						</CardContent>
					</Card>
				</Link>
				<Link href='/dashboard/users'>
					<Card className='hover:bg-accent cursor-pointer transition-colors'>
						<CardContent className='flex items-center gap-3 p-4'>
							<IconUsers className='h-5 w-5 text-purple-500' />
							<span className='font-medium'>Manage Users</span>
							<IconArrowRight className='h-4 w-4 ml-auto text-muted-foreground' />
						</CardContent>
					</Card>
				</Link>
				<Link href='/dashboard/analytics'>
					<Card className='hover:bg-accent cursor-pointer transition-colors'>
						<CardContent className='flex items-center gap-3 p-4'>
							<IconCurrencyDollar className='h-5 w-5 text-yellow-500' />
							<span className='font-medium'>Revenue Reports</span>
							<IconArrowRight className='h-4 w-4 ml-auto text-muted-foreground' />
						</CardContent>
					</Card>
				</Link>
			</div>
		</div>
	);
}
