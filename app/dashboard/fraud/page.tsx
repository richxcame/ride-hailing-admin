'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
	IconAlertTriangle,
	IconChartBar,
	IconFilter,
	IconRefresh,
	IconShieldCheck,
} from '@tabler/icons-react';
import Link from 'next/link';
import { fraudService } from '@/lib/api/fraud.service';
import { FraudAlert } from '@/lib/types/models';
import { FraudAlertsTable } from '@/components/fraud-alerts-table';
import { FraudAlertDetailSheet } from '@/components/fraud-alert-detail-sheet';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export default function FraudAlertsPage() {
	const [alerts, setAlerts] = useState<FraudAlert[]>([]);
	const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [pagination, setPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});
	const [filters, setFilters] = useState({
		status: '',
		alert_level: '',
		alert_type: '',
	});
	const [stats, setStats] = useState({
		total_alerts: 0,
		pending_alerts: 0,
		investigating_alerts: 0,
		resolved_alerts: 0,
		critical_alerts: 0,
	});

	const fetchAlerts = useCallback(async () => {
		try {
			setIsLoading(true);
			const params: Record<string, string | number> = {
				limit: pagination.limit,
				offset: pagination.offset,
			};

			if (filters.status && filters.status !== 'all')
				params.status = filters.status;
			if (filters.alert_level && filters.alert_level !== 'all')
				params.alert_level = filters.alert_level;
			if (filters.alert_type && filters.alert_type !== 'all')
				params.alert_type = filters.alert_type;

			const response = await fraudService.getAlerts(params);
			setAlerts(response.data);
			setPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));

			// Use stats from API meta if available, otherwise fetch separately
			const meta = response.meta as {
				total: number;
				stats?: Record<string, number>;
			};
			if (meta.stats) {
				setStats({
					total_alerts: meta.total,
					pending_alerts: meta.stats.pending ?? 0,
					investigating_alerts: meta.stats.investigating ?? 0,
					resolved_alerts: meta.stats.resolved ?? 0,
					critical_alerts: meta.stats.critical ?? 0,
				});
			} else {
				try {
					const statsData =
						(await fraudService.getStatistics()) as unknown as Record<
							string,
							unknown
						>;
					setStats({
						total_alerts: meta.total,
						pending_alerts:
							(statsData.pending_alerts as number) ?? 0,
						investigating_alerts:
							(statsData.investigating_alerts as number) ?? 0,
						resolved_alerts:
							(statsData.resolved_alerts as number) ?? 0,
						critical_alerts:
							(statsData.critical_alerts as number) ?? 0,
					});
				} catch {
					// Fallback: estimate from current page (less accurate for large datasets)
					setStats({
						total_alerts: meta.total,
						pending_alerts: response.data.filter(
							(a) => a.status === 'pending',
						).length,
						investigating_alerts: response.data.filter(
							(a) => a.status === 'investigating',
						).length,
						resolved_alerts: response.data.filter(
							(a) =>
								a.status === 'confirmed' ||
								a.status === 'false_positive' ||
								a.status === 'resolved',
						).length,
						critical_alerts: response.data.filter(
							(a) => a.alert_level === 'critical',
						).length,
					});
				}
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to load fraud alerts';
			toast.error('Failed to load fraud alerts', {
				description: errorMessage,
			});
		} finally {
			setIsLoading(false);
		}
	}, [pagination.limit, pagination.offset, filters]);

	useEffect(() => {
		fetchAlerts();
	}, [fetchAlerts]);

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	const handleAlertAction = async (
		action: 'view' | 'investigate' | 'resolve',
		alertId: string,
	) => {
		const alert = alerts.find((a) => a.id === alertId);
		if (!alert) return;

		if (action === 'view') {
			setSelectedAlert(alert);
			setIsSheetOpen(true);
		} else if (action === 'investigate') {
			try {
				await fraudService.investigateAlert(alertId);
				toast.success('Alert marked as investigating');
				fetchAlerts();
			} catch {
				toast.error('Failed to update alert');
			}
		} else if (action === 'resolve') {
			setSelectedAlert(alert);
			setIsSheetOpen(true);
		}
	};

	const handleInvestigate = async (alertId: string, notes?: string) => {
		try {
			await fraudService.investigateAlert(
				alertId,
				notes ? { notes } : undefined,
			);
			toast.success('Alert marked as investigating');
			fetchAlerts();
			setIsSheetOpen(false);
		} catch {
			toast.error('Failed to update alert status');
		}
	};

	const handleResolve = async (
		alertId: string,
		status: 'confirmed' | 'false_positive',
		actionTaken?: string,
		notes?: string,
	) => {
		try {
			await fraudService.resolveAlert(alertId, {
				status,
				action_taken: actionTaken,
				notes,
			});
			toast.success('Alert resolved successfully');
			fetchAlerts();
			setIsSheetOpen(false);
		} catch {
			toast.error('Failed to resolve alert');
		}
	};

	const clearFilters = () => {
		setFilters({
			status: '',
			alert_level: '',
			alert_type: '',
		});
		setPagination((prev) => ({ ...prev, offset: 0 }));
	};

	const hasActiveFilters =
		(filters.status && filters.status !== 'all') ||
		(filters.alert_level && filters.alert_level !== 'all') ||
		(filters.alert_type && filters.alert_type !== 'all');

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>
						Fraud Alerts
					</h1>
					<p className='text-sm text-muted-foreground'>
						Monitor and investigate fraud detection alerts
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<Button variant='outline' size='sm' asChild>
						<Link href='/dashboard/fraud/statistics'>
							<IconChartBar className='mr-2 h-4 w-4' />
							Statistics
						</Link>
					</Button>
					<Button variant='outline' size='sm' onClick={fetchAlerts}>
						<IconRefresh className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Total Alerts</CardDescription>
						<IconAlertTriangle className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>
							{stats.total_alerts}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Pending</CardDescription>
						<IconAlertTriangle className='h-4 w-4 text-blue-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-blue-600'>
							{stats.pending_alerts}
						</div>
						<p className='text-xs text-muted-foreground mt-1'>
							Awaiting review
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Investigating</CardDescription>
						<IconAlertTriangle className='h-4 w-4 text-purple-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-purple-600'>
							{stats.investigating_alerts}
						</div>
						<p className='text-xs text-muted-foreground mt-1'>
							Under review
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Critical</CardDescription>
						<IconAlertTriangle className='h-4 w-4 text-red-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-red-600'>
							{stats.critical_alerts}
						</div>
						<p className='text-xs text-muted-foreground mt-1'>
							High priority
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Resolved</CardDescription>
						<IconShieldCheck className='h-4 w-4 text-green-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold text-green-600'>
							{stats.resolved_alerts}
						</div>
						<p className='text-xs text-muted-foreground mt-1'>
							Completed
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2 text-base'>
						<IconFilter className='h-4 w-4' />
						Filters
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid gap-4 md:grid-cols-4'>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>
								Status
							</label>
							<Select
								value={filters.status}
								onValueChange={(value) => {
									setFilters((prev) => ({
										...prev,
										status: value,
									}));
									setPagination((prev) => ({
										...prev,
										offset: 0,
									}));
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder='All statuses' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>
										All statuses
									</SelectItem>
									<SelectItem value='pending'>
										Pending
									</SelectItem>
									<SelectItem value='investigating'>
										Investigating
									</SelectItem>
									<SelectItem value='confirmed'>
										Confirmed
									</SelectItem>
									<SelectItem value='false_positive'>
										False Positive
									</SelectItem>
									<SelectItem value='resolved'>
										Resolved
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<label className='text-sm font-medium'>
								Severity Level
							</label>
							<Select
								value={filters.alert_level}
								onValueChange={(value) => {
									setFilters((prev) => ({
										...prev,
										alert_level: value,
									}));
									setPagination((prev) => ({
										...prev,
										offset: 0,
									}));
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder='All levels' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>
										All levels
									</SelectItem>
									<SelectItem value='low'>Low</SelectItem>
									<SelectItem value='medium'>
										Medium
									</SelectItem>
									<SelectItem value='high'>High</SelectItem>
									<SelectItem value='critical'>
										Critical
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<label className='text-sm font-medium'>
								Alert Type
							</label>
							<Select
								value={filters.alert_type}
								onValueChange={(value) => {
									setFilters((prev) => ({
										...prev,
										alert_type: value,
									}));
									setPagination((prev) => ({
										...prev,
										offset: 0,
									}));
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder='All types' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>
										All types
									</SelectItem>
									<SelectItem value='payment_fraud'>
										Payment Fraud
									</SelectItem>
									<SelectItem value='account_fraud'>
										Account Fraud
									</SelectItem>
									<SelectItem value='location_fraud'>
										Location Fraud
									</SelectItem>
									<SelectItem value='ride_fraud'>
										Ride Fraud
									</SelectItem>
									<SelectItem value='rating_manipulation'>
										Rating Manipulation
									</SelectItem>
									<SelectItem value='promo_abuse'>
										Promo Abuse
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='flex items-end'>
							<Button
								variant='outline'
								onClick={clearFilters}
								disabled={!hasActiveFilters}
								className='w-full'
							>
								Clear Filters
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Alerts Table */}
			<Card>
				<CardHeader>
					<CardTitle>Fraud Alerts</CardTitle>
					<CardDescription>
						{isLoading
							? 'Loading alerts...'
							: `Showing ${alerts.length} of ${pagination.total} alerts`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<FraudAlertsTable
						alerts={alerts}
						isLoading={isLoading}
						pagination={pagination}
						onPageChange={handlePageChange}
						onAlertAction={handleAlertAction}
					/>
				</CardContent>
			</Card>

			{/* Alert Detail Sheet */}
			<FraudAlertDetailSheet
				alert={selectedAlert}
				open={isSheetOpen}
				onOpenChange={setIsSheetOpen}
				onInvestigate={handleInvestigate}
				onResolve={handleResolve}
			/>
		</div>
	);
}
