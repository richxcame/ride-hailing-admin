'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable } from '@/components/data-table';
import { SectionCards } from '@/components/section-cards';
import { adminService } from '@/lib/api/admin.service';
import { DashboardStats } from '@/lib/types/models';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconAlertCircle } from '@tabler/icons-react';

import fallbackData from './data.json';

export default function Page() {
	const [stats, setStats] = useState<DashboardStats | undefined>();
	const [isLoadingStats, setIsLoadingStats] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setIsLoadingStats(true);
				const dashboardStats = await adminService.getDashboard();
				setStats(dashboardStats);
				setError(null);
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';
				setError(errorMessage);
				toast.error('Failed to load dashboard stats', {
					description: errorMessage,
				});
			} finally {
				setIsLoadingStats(false);
			}
		};

		fetchDashboardData();
	}, []);

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Dashboard</h1>
					<p className='text-sm text-muted-foreground'>
						Overview of your ride-hailing platform
					</p>
				</div>
			</div>

			{error && (
				<Alert variant='destructive'>
					<IconAlertCircle className='h-4 w-4' />
					<AlertDescription>
						{error}. Using fallback data for demonstration.
					</AlertDescription>
				</Alert>
			)}

			<SectionCards stats={stats} isLoading={isLoadingStats} />

			<div className='rounded-lg border p-4'>
				<h2 className='mb-4 text-lg font-semibold'>Revenue Overview</h2>
				<ChartAreaInteractive />
			</div>

			<div className='rounded-lg border p-4'>
				<h2 className='mb-4 text-lg font-semibold'>Recent Activity</h2>
				<DataTable data={fallbackData} />
			</div>
		</div>
	);
}
