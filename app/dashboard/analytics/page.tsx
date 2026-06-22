'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
	IconRefresh,
	IconTrendingUp,
	IconTrendingDown,
	IconCar,
	IconUsers,
	IconCurrencyDollar,
	IconStar,
	IconClock,
	IconMapPin,
	IconPlayerPlay,
	IconChartBar,
	IconFileText,
	IconArrowUp,
	IconArrowDown,
} from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import type {
	AnalyticsDashboard,
	RevenueAnalytics,
	RideTypeAnalytics,
	TopDriver,
	RidesMetrics,
	DriversPerformance,
	RidersGrowth,
	FinancialReport,
} from '@/lib/types/models';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DatePicker } from '@/components/date-picker';
import {
	PieChart,
	Pie,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	LabelList,
} from 'recharts';
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '@/components/ui/chart';

// Slice/series colours pulled from the brand --chart-* palette (oklch purples).
const CHART_PALETTE = [
	'var(--chart-1)',
	'var(--chart-2)',
	'var(--chart-3)',
	'var(--chart-4)',
	'var(--chart-5)',
];

const financialChartConfig = {
	amount: { label: 'Amount' },
} satisfies ChartConfig;

export default function AnalyticsPage() {
	const [isLoading, setIsLoading] = useState(true);
	const [startDate, setStartDate] = useState<Date | undefined>(
		() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
	);
	const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());

	// Analytics data states
	const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null);
	const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);
	const [rideTypes, setRideTypes] = useState<RideTypeAnalytics[]>([]);
	const [topDrivers, setTopDrivers] = useState<TopDriver[]>([]);
	const [ridesMetrics, setRidesMetrics] = useState<RidesMetrics | null>(null);
	const [driversPerformance, setDriversPerformance] = useState<DriversPerformance | null>(null);
	const [ridersGrowth, setRidersGrowth] = useState<RidersGrowth | null>(null);
	const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);

	const fetchAnalytics = useCallback(async () => {
		try {
			setIsLoading(true);
			const params = {
				start_date: startDate?.toISOString().split('T')[0] || '',
				end_date: endDate?.toISOString().split('T')[0] || '',
			};

			const [
				dashboardData,
				revenueData,
				rideTypesData,
				topDriversData,
				metricsData,
				driversData,
				ridersData,
				financialData,
			] = await Promise.all([
				adminService.getAnalyticsDashboard(),
				adminService.getAnalyticsRevenue(params),
				adminService.getAnalyticsRideTypes(params),
				adminService.getAnalyticsTopDrivers({ ...params, limit: 10 }),
				adminService.getAnalyticsRidesMetrics(params),
				adminService.getAnalyticsDriversPerformance(params),
				adminService.getAnalyticsRidersGrowth(params),
				adminService.getAnalyticsFinancialReport(params),
			]);

			setDashboard(dashboardData);
			setRevenue(revenueData);
			setRideTypes(Array.isArray(rideTypesData) ? rideTypesData : []);
			setTopDrivers(Array.isArray(topDriversData) ? topDriversData : []);
			setRidesMetrics(metricsData);
			setDriversPerformance(driversData);
			setRidersGrowth(ridersData);
			setFinancialReport(financialData);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics';
			toast.error('Failed to load analytics', { description: errorMessage });
		} finally {
			setIsLoading(false);
		}
	}, [startDate, endDate]);

	useEffect(() => {
		let active = true;
		const load = async () => {
			try {
				const params = {
					start_date: startDate?.toISOString().split('T')[0] || '',
					end_date: endDate?.toISOString().split('T')[0] || '',
				};

				const [
					dashboardData,
					revenueData,
					rideTypesData,
					topDriversData,
					metricsData,
					driversData,
					ridersData,
					financialData,
				] = await Promise.all([
					adminService.getAnalyticsDashboard(),
					adminService.getAnalyticsRevenue(params),
					adminService.getAnalyticsRideTypes(params),
					adminService.getAnalyticsTopDrivers({ ...params, limit: 10 }),
					adminService.getAnalyticsRidesMetrics(params),
					adminService.getAnalyticsDriversPerformance(params),
					adminService.getAnalyticsRidersGrowth(params),
					adminService.getAnalyticsFinancialReport(params),
				]);

				if (active) {
					setDashboard(dashboardData);
					setRevenue(revenueData);
					setRideTypes(Array.isArray(rideTypesData) ? rideTypesData : []);
					setTopDrivers(Array.isArray(topDriversData) ? topDriversData : []);
					setRidesMetrics(metricsData);
					setDriversPerformance(driversData);
					setRidersGrowth(ridersData);
					setFinancialReport(financialData);
				}
			} catch (error) {
				if (active) {
					const errorMessage =
						error instanceof Error ? error.message : 'Failed to load analytics';
					toast.error('Failed to load analytics', { description: errorMessage });
				}
			} finally {
				if (active) setIsLoading(false);
			}
		};
		load();
		return () => {
			active = false;
		};
	}, [startDate, endDate]);

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(value);
	};

	const formatPercent = (value: number) => {
		return `${(value * 100).toFixed(1)}%`;
	};

	const formatNumber = (value: number) => {
		return value.toLocaleString();
	};

	// Ride-type donut: colour each slice and build the config the shadcn chart
	// tooltip uses to resolve slice labels.
	const { rideTypeData, rideTypeChartConfig } = useMemo(() => {
		const data = rideTypes.map((type, i) => ({
			...type,
			fill: CHART_PALETTE[i % CHART_PALETTE.length],
		}));
		const config: ChartConfig = { total_rides: { label: 'Rides' } };
		rideTypes.forEach((type, i) => {
			config[type.name] = {
				label: type.name,
				color: CHART_PALETTE[i % CHART_PALETTE.length],
			};
		});
		return { rideTypeData: data, rideTypeChartConfig: config };
	}, [rideTypes]);

	// Financial tab: gross revenue vs total expenses vs net profit.
	const financialBarData = financialReport
		? [
				{ label: 'Gross Revenue', amount: financialReport.gross_revenue, fill: 'var(--chart-2)' },
				{ label: 'Expenses', amount: financialReport.total_expenses, fill: 'var(--chart-5)' },
				{ label: 'Net Profit', amount: financialReport.profit, fill: 'var(--chart-1)' },
			]
		: [];

	if (isLoading && !dashboard) {
		return (
			<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
				<div className='space-y-4'>
					<Skeleton className='h-10 w-64' />
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
						{[...Array(4)].map((_, i) => (
							<Skeleton key={i} className='h-32' />
						))}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Analytics</h1>
					<p className='text-sm text-muted-foreground'>
						Comprehensive insights into your ride-hailing platform
					</p>
				</div>
				<div className='flex items-center gap-2'>
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
					<Button variant='outline' size='sm' onClick={fetchAnalytics} className='mt-5'>
						<IconRefresh className='h-4 w-4' />
					</Button>
				</div>
			</div>

			<Tabs defaultValue='overview' className='space-y-4'>
				<TabsList>
					<TabsTrigger value='overview'>Overview</TabsTrigger>
					<TabsTrigger value='revenue'>Revenue</TabsTrigger>
					<TabsTrigger value='operations'>Operations</TabsTrigger>
					<TabsTrigger value='performance'>Performance</TabsTrigger>
					<TabsTrigger value='financial'>Financial</TabsTrigger>
				</TabsList>

				{/* Overview Tab */}
				<TabsContent value='overview' className='space-y-4'>
					{/* Key Metrics */}
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Total Rides</CardDescription>
								<IconCar className='h-4 w-4 text-muted-foreground' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{formatNumber(dashboard?.total_rides ?? 0)}
								</div>
								<p className='text-xs text-muted-foreground mt-1'>
									{dashboard?.active_rides ?? 0} active right now
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Revenue Today</CardDescription>
								<IconCurrencyDollar className='h-4 w-4 text-green-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold text-green-600'>
									{formatCurrency(dashboard?.revenue_today ?? 0)}
								</div>
								<p className='text-xs text-muted-foreground mt-1'>
									{dashboard?.completed_today ?? 0} rides completed
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Active Users</CardDescription>
								<IconUsers className='h-4 w-4 text-blue-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{formatNumber((dashboard?.active_drivers ?? 0) + (dashboard?.active_riders ?? 0))}
								</div>
								<p className='text-xs text-muted-foreground mt-1'>
									{dashboard?.active_drivers ?? 0} drivers • {dashboard?.active_riders ?? 0} riders
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
									{(dashboard?.avg_rating ?? 0).toFixed(1)}
									<IconStar className='h-5 w-5 fill-yellow-400 text-yellow-400' />
								</div>
								<p className='text-xs text-muted-foreground mt-1'>Customer satisfaction</p>
							</CardContent>
						</Card>
					</div>

					{/* Ride Types Distribution */}
					<Card>
						<CardHeader>
							<CardTitle>Ride Types Distribution</CardTitle>
							<CardDescription>Performance by vehicle type for selected period</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='grid items-center gap-6 lg:grid-cols-2'>
								{rideTypeData.length > 0 && (
									<ChartContainer
										config={rideTypeChartConfig}
										className='mx-auto aspect-square w-full max-w-[260px]'
									>
										<PieChart>
											<ChartTooltip content={<ChartTooltipContent nameKey='name' hideLabel />} />
											<Pie
												data={rideTypeData}
												dataKey='total_rides'
												nameKey='name'
												innerRadius={55}
												strokeWidth={2}
											/>
										</PieChart>
									</ChartContainer>
								)}
								<div className='space-y-4'>
									{rideTypes.map((type) => (
										<div key={type.ride_type_id} className='space-y-2'>
											<div className='flex items-center justify-between'>
												<div className='flex items-center gap-2'>
													<span className='font-medium'>{type.name}</span>
													<Badge variant='secondary'>{type.percentage.toFixed(1)}%</Badge>
												</div>
												<div className='text-sm text-muted-foreground'>
													{formatNumber(type.total_rides)} rides • {formatCurrency(type.total_revenue)}
												</div>
											</div>
											<Progress value={type.percentage} className='h-2' />
										</div>
									))}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Top Drivers */}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<IconChartBar className='h-5 w-5' />
								Top Performing Drivers
							</CardTitle>
							<CardDescription>Best drivers for selected period</CardDescription>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Driver</TableHead>
										<TableHead className='text-right'>Rides</TableHead>
										<TableHead className='text-right'>Earnings</TableHead>
										<TableHead className='text-right'>Rating</TableHead>
										<TableHead className='text-right'>Completion</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{topDrivers.map((driver, index) => (
										<TableRow key={driver.driver_id}>
											<TableCell>
												<div className='flex items-center gap-2'>
													<Badge variant='outline' className='h-6 w-6 rounded-full p-0 flex items-center justify-center'>
														{index + 1}
													</Badge>
													<span className='font-medium'>{driver.driver_name}</span>
												</div>
											</TableCell>
											<TableCell className='text-right'>{formatNumber(driver.total_rides)}</TableCell>
											<TableCell className='text-right font-medium text-green-600'>
												{formatCurrency(driver.total_earnings)}
											</TableCell>
											<TableCell className='text-right'>
												<div className='flex items-center justify-end gap-1'>
													<IconStar className='h-4 w-4 fill-yellow-400 text-yellow-400' />
													<span>{driver.avg_rating.toFixed(1)}</span>
												</div>
											</TableCell>
											<TableCell className='text-right'>{driver.completion_rate.toFixed(0)}%</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Revenue Tab */}
				<TabsContent value='revenue' className='space-y-4'>
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Total Revenue</CardDescription>
								<IconCurrencyDollar className='h-4 w-4 text-green-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold text-green-600'>
									{formatCurrency(revenue?.total_revenue ?? 0)}
								</div>
								<p className='text-xs text-muted-foreground mt-1'>
									{formatNumber(revenue?.total_rides ?? 0)} total rides
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Platform Earnings</CardDescription>
								<IconTrendingUp className='h-4 w-4 text-blue-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold text-blue-600'>
									{formatCurrency(revenue?.platform_earnings ?? 0)}
								</div>
								<p className='text-xs text-muted-foreground mt-1'>Commission from rides</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Driver Earnings</CardDescription>
								<IconCar className='h-4 w-4 text-purple-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold text-purple-600'>
									{formatCurrency(revenue?.driver_earnings ?? 0)}
								</div>
								<p className='text-xs text-muted-foreground mt-1'>Total driver payouts</p>
							</CardContent>
						</Card>
					</div>

					<div className='grid gap-4 md:grid-cols-2'>
						<Card>
							<CardHeader>
								<CardTitle>Revenue Breakdown</CardTitle>
								<CardDescription>{revenue?.period}</CardDescription>
							</CardHeader>
							<CardContent className='space-y-3'>
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Avg Fare per Ride</span>
									<span className='font-medium'>{formatCurrency(revenue?.avg_fare_per_ride ?? 0)}</span>
								</div>
								<Separator />
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Total Discounts</span>
									<span className='font-medium text-red-600'>
										-{formatCurrency(revenue?.total_discounts ?? 0)}
									</span>
								</div>
								<Separator />
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Platform Commission</span>
									<span className='font-medium text-green-600'>
										{formatCurrency(revenue?.platform_earnings ?? 0)}
									</span>
								</div>
								<Separator />
								<div className='flex justify-between items-center pt-2 border-t-2'>
									<span className='text-sm font-semibold'>Net Revenue</span>
									<span className='font-bold text-lg text-green-600'>
										{formatCurrency(revenue?.total_revenue ?? 0)}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Ride Types Revenue</CardTitle>
								<CardDescription>Revenue contribution by vehicle type</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='space-y-4'>
									{rideTypes
										.sort((a, b) => b.total_revenue - a.total_revenue)
										.map((type) => (
											<div key={type.ride_type_id} className='flex items-center justify-between'>
												<div className='flex flex-col'>
													<span className='font-medium'>{type.name}</span>
													<span className='text-xs text-muted-foreground'>
														{formatNumber(type.total_rides)} rides • Avg {formatCurrency(type.avg_fare)}
													</span>
												</div>
												<div className='text-right'>
													<div className='font-semibold text-green-600'>
														{formatCurrency(type.total_revenue)}
													</div>
													<div className='text-xs text-muted-foreground'>{type.percentage.toFixed(1)}%</div>
												</div>
											</div>
										))}
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Operations Tab */}
				<TabsContent value='operations' className='space-y-4'>
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Avg Wait Time</CardDescription>
								<IconClock className='h-4 w-4 text-blue-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{(ridesMetrics?.avg_wait_time_minutes ?? 0).toFixed(1)} min
								</div>
								<p className='text-xs text-muted-foreground mt-1'>Time to driver arrival</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Avg Duration</CardDescription>
								<IconPlayerPlay className='h-4 w-4 text-purple-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{(ridesMetrics?.avg_ride_duration_minutes ?? 0).toFixed(1)} min
								</div>
								<p className='text-xs text-muted-foreground mt-1'>Average ride length</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Avg Distance</CardDescription>
								<IconMapPin className='h-4 w-4 text-green-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{(ridesMetrics?.avg_distance_km ?? 0).toFixed(1)} km
								</div>
								<p className='text-xs text-muted-foreground mt-1'>Per ride distance</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Cancellation Rate</CardDescription>
								<IconTrendingDown className='h-4 w-4 text-red-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold text-red-600'>
									{formatPercent(ridesMetrics?.cancellation_rate ?? 0)}
								</div>
								<p className='text-xs text-muted-foreground mt-1'>Overall cancellations</p>
							</CardContent>
						</Card>
					</div>

					<div className='grid gap-4 md:grid-cols-2'>
						<Card>
							<CardHeader>
								<CardTitle>Cancellation Breakdown</CardTitle>
								<CardDescription>Who cancels rides?</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='space-y-2'>
									<div className='flex justify-between text-sm'>
										<span>Rider Cancellations</span>
										<span className='font-medium'>
											{formatPercent(ridesMetrics?.rider_cancellation_rate ?? 0)}
										</span>
									</div>
									<Progress
										value={(ridesMetrics?.rider_cancellation_rate ?? 0) * 100}
										className='h-2'
									/>
								</div>
								<div className='space-y-2'>
									<div className='flex justify-between text-sm'>
										<span>Driver Cancellations</span>
										<span className='font-medium'>
											{formatPercent(ridesMetrics?.driver_cancellation_rate ?? 0)}
										</span>
									</div>
									<Progress
										value={(ridesMetrics?.driver_cancellation_rate ?? 0) * 100}
										className='h-2'
									/>
								</div>
								<Separator />
								<div className='flex justify-between items-center pt-2'>
									<span className='font-semibold'>Total Cancellation Rate</span>
									<span className='font-bold text-red-600'>
										{formatPercent(ridesMetrics?.cancellation_rate ?? 0)}
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Surge Pricing Impact</CardTitle>
								<CardDescription>Dynamic pricing analytics</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='flex items-center justify-between'>
									<span className='text-sm text-muted-foreground'>Surge Rides</span>
									<span className='font-bold text-lg text-orange-600'>
										{formatPercent(ridesMetrics?.surge_rides_percentage ?? 0)}
									</span>
								</div>
								<Progress value={(ridesMetrics?.surge_rides_percentage ?? 0) * 100} className='h-2' />
								<Separator />
								<div className='flex items-center justify-between'>
									<span className='text-sm text-muted-foreground'>Avg Surge Multiplier</span>
									<span className='font-semibold text-orange-600'>
										{(ridesMetrics?.avg_surge_multiplier ?? 0).toFixed(2)}x
									</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Performance Tab */}
				<TabsContent value='performance' className='space-y-4'>
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Active Drivers</CardDescription>
								<IconCar className='h-4 w-4 text-blue-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{formatNumber(driversPerformance?.total_active_drivers ?? 0)}
								</div>
								<div className='flex items-center gap-1 mt-1 text-xs text-green-600'>
									<IconArrowUp className='h-3 w-3' />
									<span>{driversPerformance?.new_drivers ?? 0} new this period</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Avg Rides/Driver</CardDescription>
								<IconChartBar className='h-4 w-4 text-purple-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{(driversPerformance?.avg_rides_per_driver ?? 0).toFixed(1)}
								</div>
								<p className='text-xs text-muted-foreground mt-1'>Per driver productivity</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Acceptance Rate</CardDescription>
								<IconTrendingUp className='h-4 w-4 text-green-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold text-green-600'>
									{formatPercent(driversPerformance?.avg_acceptance_rate ?? 0)}
								</div>
								<p className='text-xs text-muted-foreground mt-1'>Ride requests accepted</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className='flex flex-row items-center justify-between pb-2'>
								<CardDescription>Avg Online Hours</CardDescription>
								<IconClock className='h-4 w-4 text-orange-600' />
							</CardHeader>
							<CardContent>
								<div className='text-2xl font-bold'>
									{(driversPerformance?.avg_online_hours ?? 0).toFixed(1)}h
								</div>
								<p className='text-xs text-muted-foreground mt-1'>Per driver per period</p>
							</CardContent>
						</Card>
					</div>

					<div className='grid gap-4 md:grid-cols-2'>
						<Card>
							<CardHeader>
								<CardTitle>Driver Metrics</CardTitle>
								<CardDescription>Key performance indicators</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Average Rating</span>
									<div className='flex items-center gap-1'>
										<IconStar className='h-4 w-4 fill-yellow-400 text-yellow-400' />
										<span className='font-medium'>
											{(driversPerformance?.avg_rating ?? 0).toFixed(2)}
										</span>
									</div>
								</div>
								<Separator />
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Cancellation Rate</span>
									<span className='font-medium text-red-600'>
										{formatPercent(driversPerformance?.avg_cancellation_rate ?? 0)}
									</span>
								</div>
								<Separator />
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Churned Drivers</span>
									<div className='flex items-center gap-1'>
										<IconArrowDown className='h-3 w-3 text-red-600' />
										<span className='font-medium text-red-600'>
											{driversPerformance?.churned_drivers ?? 0}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Rider Growth</CardTitle>
								<CardDescription>User acquisition and retention</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>New Riders</span>
									<div className='flex items-center gap-1'>
										<IconArrowUp className='h-3 w-3 text-green-600' />
										<span className='font-medium text-green-600'>
											{formatNumber(ridersGrowth?.new_riders ?? 0)}
										</span>
									</div>
								</div>
								<Separator />
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Retention Rate</span>
									<span className='font-medium text-green-600'>
										{formatPercent(ridersGrowth?.retention_rate ?? 0)}
									</span>
								</div>
								<Separator />
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Avg Rides/Rider</span>
									<span className='font-medium'>{(ridersGrowth?.avg_rides_per_rider ?? 0).toFixed(1)}</span>
								</div>
								<Separator />
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Lifetime Value</span>
									<span className='font-medium text-green-600'>
										{formatCurrency(ridersGrowth?.lifetime_value_avg ?? 0)}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				{/* Financial Tab */}
				<TabsContent value='financial' className='space-y-4'>
					{financialReport && (
						<Card>
							<CardHeader>
								<CardTitle>Revenue vs Expenses</CardTitle>
								<CardDescription>
									Gross revenue, total expenses, and net profit
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ChartContainer config={financialChartConfig} className='h-[260px] w-full'>
									<BarChart data={financialBarData} margin={{ top: 24 }}>
										<CartesianGrid vertical={false} className='stroke-muted' />
										<XAxis
											dataKey='label'
											tickLine={false}
											axisLine={false}
											tickMargin={8}
											className='text-xs'
										/>
										<YAxis
											tickLine={false}
											axisLine={false}
											width={56}
											className='text-xs'
											tickFormatter={(value) => `$${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
										/>
										<ChartTooltip
											cursor={false}
											content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
										/>
										<Bar dataKey='amount' radius={[6, 6, 0, 0]}>
											<LabelList
												dataKey='amount'
												position='top'
												className='fill-foreground text-xs'
												formatter={(value: number) => formatCurrency(value)}
											/>
										</Bar>
									</BarChart>
								</ChartContainer>
							</CardContent>
						</Card>
					)}
					<Card>
						<CardHeader>
							<CardTitle className='flex items-center gap-2'>
								<IconFileText className='h-5 w-5' />
								Financial Report
							</CardTitle>
							<CardDescription>{financialReport?.period}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className='grid gap-6 md:grid-cols-2'>
								<div className='space-y-4'>
									<h3 className='font-semibold text-sm uppercase tracking-wider text-muted-foreground'>
										Revenue
									</h3>
									<div className='space-y-3'>
										<div className='flex justify-between items-center'>
											<span className='text-sm'>Gross Revenue</span>
											<span className='font-medium'>
												{formatCurrency(financialReport?.gross_revenue ?? 0)}
											</span>
										</div>
										<div className='flex justify-between items-center'>
											<span className='text-sm'>Platform Commission</span>
											<span className='font-medium text-green-600'>
												{formatCurrency(financialReport?.platform_commission ?? 0)}
											</span>
										</div>
										<div className='flex justify-between items-center pt-2 border-t'>
											<span className='font-semibold'>Net Revenue</span>
											<span className='font-bold text-green-600'>
												{formatCurrency(financialReport?.net_revenue ?? 0)}
											</span>
										</div>
									</div>
								</div>

								<div className='space-y-4'>
									<h3 className='font-semibold text-sm uppercase tracking-wider text-muted-foreground'>
										Expenses
									</h3>
									<div className='space-y-3'>
										<div className='flex justify-between items-center'>
											<span className='text-sm'>Driver Payouts</span>
											<span className='font-medium text-red-600'>
												{formatCurrency(financialReport?.driver_payouts ?? 0)}
											</span>
										</div>
										<div className='flex justify-between items-center'>
											<span className='text-sm'>Promo Discounts</span>
											<span className='font-medium text-red-600'>
												{formatCurrency(financialReport?.promo_discounts ?? 0)}
											</span>
										</div>
										<div className='flex justify-between items-center'>
											<span className='text-sm'>Referral Bonuses</span>
											<span className='font-medium text-red-600'>
												{formatCurrency(financialReport?.referral_bonuses ?? 0)}
											</span>
										</div>
										<div className='flex justify-between items-center'>
											<span className='text-sm'>Refunds</span>
											<span className='font-medium text-red-600'>
												{formatCurrency(financialReport?.refunds ?? 0)}
											</span>
										</div>
										<div className='flex justify-between items-center pt-2 border-t'>
											<span className='font-semibold'>Total Expenses</span>
											<span className='font-bold text-red-600'>
												{formatCurrency(financialReport?.total_expenses ?? 0)}
											</span>
										</div>
									</div>
								</div>
							</div>

							<Separator className='my-6' />

							<div className='grid gap-4 md:grid-cols-3'>
								<div className='text-center p-6 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900'>
									<div className='text-3xl font-bold text-green-600'>
										{formatCurrency(financialReport?.profit ?? 0)}
									</div>
									<p className='text-sm text-muted-foreground mt-2'>Net Profit</p>
								</div>
								<div className='text-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900'>
									<div className='text-3xl font-bold text-blue-600'>
										{(financialReport?.profit_margin_percent ?? 0).toFixed(1)}%
									</div>
									<p className='text-sm text-muted-foreground mt-2'>Profit Margin</p>
								</div>
								<div className='text-center p-6 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900'>
									<div className='text-3xl font-bold text-purple-600'>
										{formatCurrency(financialReport?.avg_revenue_per_ride ?? 0)}
									</div>
									<p className='text-sm text-muted-foreground mt-2'>Avg Revenue/Ride</p>
								</div>
							</div>

							<Separator className='my-6' />

							<div className='grid gap-4 md:grid-cols-3'>
								<div className='flex justify-between items-center p-4 rounded-lg border'>
									<span className='text-sm text-muted-foreground'>Total Rides</span>
									<span className='font-semibold'>{formatNumber(financialReport?.total_rides ?? 0)}</span>
								</div>
								<div className='flex justify-between items-center p-4 rounded-lg border'>
									<span className='text-sm text-muted-foreground'>Completed</span>
									<span className='font-semibold text-green-600'>
										{formatNumber(financialReport?.completed_rides ?? 0)}
									</span>
								</div>
								<div className='flex justify-between items-center p-4 rounded-lg border'>
									<span className='text-sm text-muted-foreground'>Cancelled</span>
									<span className='font-semibold text-red-600'>
										{formatNumber(financialReport?.cancelled_rides ?? 0)}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
