'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AppSidebar } from '@/components/app-sidebar';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable } from '@/components/data-table';
import { SectionCards } from '@/components/section-cards';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
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
		<SidebarProvider
			style={
				{
					'--sidebar-width': 'calc(var(--spacing) * 72)',
					'--header-height': 'calc(var(--spacing) * 12)',
				} as React.CSSProperties
			}
		>
			<AppSidebar variant='inset' />
			<SidebarInset>
				<SiteHeader />
				<div className='flex flex-1 flex-col'>
					<div className='@container/main flex flex-1 flex-col gap-2'>
						<div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
							{error && (
								<div className='px-4 lg:px-6'>
									<Alert variant='destructive'>
										<IconAlertCircle className='h-4 w-4' />
										<AlertDescription>
											{error}. Using fallback data for demonstration.
										</AlertDescription>
									</Alert>
								</div>
							)}

							<SectionCards stats={stats} isLoading={isLoadingStats} />

							<div className='px-4 lg:px-6'>
								<ChartAreaInteractive />
							</div>

							<DataTable data={fallbackData} />
						</div>
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
