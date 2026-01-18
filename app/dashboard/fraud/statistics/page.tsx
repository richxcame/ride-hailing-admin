'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
	IconRefresh,
	IconCalendar,
	IconAlertTriangle,
	IconShieldCheck,
	IconTrendingUp,
	IconCurrencyDollar,
	IconClock,
	IconUsers,
	IconChartBar,
} from '@tabler/icons-react';
import { fraudService } from '@/lib/api/fraud.service';
import type { FraudStatistics, FraudPattern } from '@/lib/types/models';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function FraudStatisticsPage() {
	const [isLoading, setIsLoading] = useState(true);
	const [dateRange, setDateRange] = useState({
		start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
		end: new Date().toISOString().split('T')[0],
	});
	const [statistics, setStatistics] = useState<FraudStatistics | null>(null);
	const [patterns, setPatterns] = useState<FraudPattern[]>([]);

	const fetchData = useCallback(async () => {
		try {
			setIsLoading(true);
			const params = {
				start_date: dateRange.start,
				end_date: dateRange.end,
			};

			const [statsData, patternsData] = await Promise.all([
				fraudService.getStatistics(params),
				fraudService.getPatterns({ limit: 10 }),
			]);

			setStatistics(statsData);
			setPatterns(patternsData);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load fraud statistics';
			toast.error('Failed to load fraud statistics', { description: errorMessage });
		} finally {
			setIsLoading(false);
		}
	}, [dateRange]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(value);
	};

	const formatNumber = (value: number) => {
		return value.toLocaleString();
	};

	const getLevelColor = (level: string) => {
		const colors = {
			low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
			medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
			high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
			critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
		};
		return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
	};

	if (isLoading && !statistics) {
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

	const alertsDistribution = statistics
		? [
				{ label: 'Critical', count: statistics.critical_alerts, color: 'bg-red-500' },
				{ label: 'High', count: statistics.high_alerts, color: 'bg-orange-500' },
				{ label: 'Medium', count: statistics.medium_alerts, color: 'bg-yellow-500' },
				{ label: 'Low', count: statistics.low_alerts, color: 'bg-blue-500' },
		  ]
		: [];

	const confirmationRate = statistics
		? statistics.total_alerts > 0
			? ((statistics.confirmed_fraud_cases / statistics.total_alerts) * 100).toFixed(1)
			: '0'
		: '0';

	const falsePositiveRate = statistics
		? statistics.total_alerts > 0
			? ((statistics.false_positives / statistics.total_alerts) * 100).toFixed(1)
			: '0'
		: '0';

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Fraud Statistics</h1>
					<p className='text-sm text-muted-foreground'>
						Comprehensive fraud detection analytics and patterns
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<div className='flex items-center gap-2'>
						<div className='flex flex-col gap-1'>
							<Label htmlFor='start-date' className='text-xs text-muted-foreground'>
								Start Date
							</Label>
							<div className='relative'>
								<IconCalendar className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
								<Input
									id='start-date'
									type='date'
									value={dateRange.start}
									onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
									className='pl-9 w-[150px]'
								/>
							</div>
						</div>
						<div className='flex flex-col gap-1'>
							<Label htmlFor='end-date' className='text-xs text-muted-foreground'>
								End Date
							</Label>
							<div className='relative'>
								<IconCalendar className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
								<Input
									id='end-date'
									type='date'
									value={dateRange.end}
									onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
									className='pl-9 w-[150px]'
								/>
							</div>
						</div>
					</div>
					<Button variant='outline' size='sm' onClick={fetchData} className='mt-5'>
						<IconRefresh className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Key Metrics */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Total Alerts</CardDescription>
						<IconAlertTriangle className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{formatNumber(statistics?.total_alerts ?? 0)}</div>
						<p className='text-xs text-muted-foreground mt-1'>
							{statistics?.pending_investigation ?? 0} pending investigation
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Confirmed Fraud</CardDescription>
						<IconShieldCheck className='h-4 w-4 text-red-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-red-600'>
							{formatNumber(statistics?.confirmed_fraud_cases ?? 0)}
						</div>
						<p className='text-xs text-muted-foreground mt-1'>{confirmationRate}% confirmation rate</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Loss Prevented</CardDescription>
						<IconCurrencyDollar className='h-4 w-4 text-green-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>
							{formatCurrency(statistics?.estimated_loss_prevented ?? 0)}
						</div>
						<p className='text-xs text-muted-foreground mt-1'>Estimated savings</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Avg Response Time</CardDescription>
						<IconClock className='h-4 w-4 text-blue-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{statistics?.average_response_time ?? 0} min</div>
						<p className='text-xs text-muted-foreground mt-1'>Time to resolution</p>
					</CardContent>
				</Card>
			</div>

			{/* Alert Distribution */}
			<div className='grid gap-4 md:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>Alert Severity Distribution</CardTitle>
						<CardDescription>{statistics?.period}</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						{alertsDistribution.map((item) => (
							<div key={item.label} className='space-y-2'>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-2'>
										<span className='font-medium'>{item.label}</span>
										<Badge variant='secondary'>
											{statistics ? ((item.count / statistics.total_alerts) * 100).toFixed(1) : 0}%
										</Badge>
									</div>
									<span className='text-sm text-muted-foreground'>{formatNumber(item.count)} alerts</span>
								</div>
								<Progress
									value={statistics ? (item.count / statistics.total_alerts) * 100 : 0}
									className='h-2'
								/>
							</div>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Investigation Outcomes</CardTitle>
						<CardDescription>Resolution breakdown</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='flex justify-between items-center'>
							<span className='text-sm text-muted-foreground'>Confirmed Fraud</span>
							<div className='text-right'>
								<span className='font-medium text-red-600'>
									{formatNumber(statistics?.confirmed_fraud_cases ?? 0)}
								</span>
								<span className='text-xs text-muted-foreground ml-2'>({confirmationRate}%)</span>
							</div>
						</div>
						<Separator />
						<div className='flex justify-between items-center'>
							<span className='text-sm text-muted-foreground'>False Positives</span>
							<div className='text-right'>
								<span className='font-medium text-green-600'>
									{formatNumber(statistics?.false_positives ?? 0)}
								</span>
								<span className='text-xs text-muted-foreground ml-2'>({falsePositiveRate}%)</span>
							</div>
						</div>
						<Separator />
						<div className='flex justify-between items-center'>
							<span className='text-sm text-muted-foreground'>Pending Investigation</span>
							<span className='font-medium text-blue-600'>
								{formatNumber(statistics?.pending_investigation ?? 0)}
							</span>
						</div>
						<Separator />
						<div className='flex justify-between items-center pt-2 border-t-2'>
							<span className='text-sm font-semibold'>Total Alerts</span>
							<span className='font-bold text-lg'>{formatNumber(statistics?.total_alerts ?? 0)}</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Fraud Patterns */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<IconChartBar className='h-5 w-5' />
						Detected Fraud Patterns
					</CardTitle>
					<CardDescription>Active fraud patterns requiring attention</CardDescription>
				</CardHeader>
				<CardContent>
					{patterns.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-8 text-center'>
							<IconShieldCheck className='h-12 w-12 text-muted-foreground mb-4' />
							<h3 className='text-lg font-semibold'>No active patterns detected</h3>
							<p className='text-sm text-muted-foreground'>System is currently clear of recurring fraud patterns</p>
						</div>
					) : (
						<div className='space-y-4'>
							{patterns.map((pattern) => (
								<div key={pattern.id} className='rounded-lg border p-4 space-y-3'>
									<div className='flex items-start justify-between'>
										<div className='flex-1'>
											<div className='flex items-center gap-2 mb-2'>
												<h4 className='font-semibold'>{pattern.pattern_type}</h4>
												<Badge variant='secondary' className={getLevelColor(pattern.severity)}>
													{pattern.severity.toUpperCase()}
												</Badge>
												{pattern.is_active && (
													<Badge variant='outline' className='bg-green-100 text-green-800'>
														ACTIVE
													</Badge>
												)}
											</div>
											<p className='text-sm text-muted-foreground mb-2'>{pattern.description}</p>
										</div>
									</div>

									<div className='flex items-center gap-6 text-sm'>
										<div className='flex items-center gap-2'>
											<IconTrendingUp className='h-4 w-4 text-muted-foreground' />
											<span className='text-muted-foreground'>Occurrences:</span>
											<span className='font-medium'>{formatNumber(pattern.occurrences)}</span>
										</div>
										<div className='flex items-center gap-2'>
											<IconUsers className='h-4 w-4 text-muted-foreground' />
											<span className='text-muted-foreground'>Affected Users:</span>
											<span className='font-medium'>{formatNumber(pattern.affected_users.length)}</span>
										</div>
										<div className='flex items-center gap-2'>
											<IconClock className='h-4 w-4 text-muted-foreground' />
											<span className='text-muted-foreground'>Last Detected:</span>
											<span className='font-medium'>
												{new Date(pattern.last_detected).toLocaleDateString()}
											</span>
										</div>
									</div>

									{pattern.details && Object.keys(pattern.details).length > 0 && (
										<>
											<Separator />
											<details className='text-sm'>
												<summary className='cursor-pointer font-medium text-muted-foreground hover:text-foreground'>
													View Pattern Details
												</summary>
												<pre className='mt-2 rounded-md bg-muted p-3 text-xs overflow-x-auto'>
													{JSON.stringify(pattern.details, null, 2)}
												</pre>
											</details>
										</>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
