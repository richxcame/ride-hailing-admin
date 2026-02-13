'use client';

import { useCallback, useEffect, useState } from 'react';
import {
	IconRefresh,
	IconVersions,
	IconSettings,
	IconArrowsShuffle,
	IconClock,
	IconCloudRain,
	IconCalendarEvent,
	IconMapPin,
	IconBan,
	IconEye,
	IconHistory,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { pricingService } from '@/lib/api/pricing.service';
import { PricingConfigVersion } from '@/lib/types/pricing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PricingVersionsTab } from '@/components/pricing/pricing-versions-tab';
import { PricingConfigsTab } from '@/components/pricing/pricing-configs-tab';
import { PricingSurgeTab } from '@/components/pricing/pricing-surge-tab';
import { PricingTimeMultipliersTab } from '@/components/pricing/pricing-time-multipliers-tab';
import { PricingWeatherMultipliersTab } from '@/components/pricing/pricing-weather-multipliers-tab';
import { PricingEventsTab } from '@/components/pricing/pricing-events-tab';
import { PricingZoneFeesTab } from '@/components/pricing/pricing-zone-fees-tab';
import { PricingCancellationTiersTab } from '@/components/pricing/pricing-cancellation-tiers-tab';
import { PricingPreviewTool } from '@/components/pricing/pricing-preview-tool';
import { PricingAuditLogsTab } from '@/components/pricing/pricing-audit-logs-tab';

interface PricingStats {
	activeVersion: PricingConfigVersion | null;
	totalConfigs: number;
	activeMultipliers: number;
	pendingEvents: number;
}

function NoVersionMessage() {
	return (
		<Card>
			<CardContent className='flex flex-col items-center justify-center py-12 text-center'>
				<IconVersions className='h-12 w-12 text-muted-foreground mb-4' />
				<h3 className='text-lg font-semibold'>No Active Version</h3>
				<p className='text-sm text-muted-foreground'>
					Create and activate a pricing version in the Versions tab to manage pricing configurations.
				</p>
			</CardContent>
		</Card>
	);
}

export default function PricingPage() {
	const [stats, setStats] = useState<PricingStats | null>(null);
	const [isLoadingStats, setIsLoadingStats] = useState(true);
	const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

	const fetchStats = useCallback(async () => {
		try {
			setIsLoadingStats(true);
			const versionsRes = await pricingService.getVersions({ limit: 100 });

			const activeVersion =
				versionsRes.data.find((v) => v.status === 'active') || null;

			setActiveVersionId(activeVersion?.id ?? null);

			if (activeVersion) {
				const [configsRes, timeRes, weatherRes, eventsRes] =
					await Promise.all([
						pricingService.getConfigs(activeVersion.id, { limit: 1 }),
						pricingService.getTimeMultipliers(activeVersion.id, { limit: 1 }),
						pricingService.getWeatherMultipliers(activeVersion.id, { limit: 1 }),
						pricingService.getEventMultipliers(activeVersion.id, { limit: 100 }),
					]);

				const now = new Date().toISOString();
				const pendingEvents = eventsRes.data.filter(
					(e) => e.starts_at > now && e.is_active
				).length;

				setStats({
					activeVersion,
					totalConfigs: Number(configsRes.meta.total) || 0,
					activeMultipliers:
						(Number(timeRes.meta.total) || 0) + (Number(weatherRes.meta.total) || 0) + (Number(eventsRes.meta.total) || 0),
					pendingEvents,
				});
			} else {
				setStats({
					activeVersion: null,
					totalConfigs: 0,
					activeMultipliers: 0,
					pendingEvents: 0,
				});
			}
		} catch {
			toast.error('Failed to load pricing stats');
		} finally {
			setIsLoadingStats(false);
		}
	}, []);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	const handleRefresh = useCallback(() => {
		fetchStats();
	}, [fetchStats]);

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Pricing Management</h1>
					<p className='text-sm text-muted-foreground'>
						Configure pricing configs, surge rules, multipliers, and fees
					</p>
				</div>
				<Button variant='outline' size='sm' onClick={handleRefresh}>
					<IconRefresh className='h-4 w-4' />
					Refresh
				</Button>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card className='border-l-4 border-l-green-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconVersions className='h-4 w-4' />
							Active Version
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-32' />
						) : (
							<div className='flex items-center gap-2'>
								<CardTitle className='text-xl'>
									{stats?.activeVersion?.name || 'None'}
								</CardTitle>
								{stats?.activeVersion ? (
									<Badge variant='default'>Active</Badge>
								) : (
									<Badge variant='secondary'>No Active</Badge>
								)}
							</div>
						)}
					</CardHeader>
				</Card>

				<Card className='border-l-4 border-l-blue-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconSettings className='h-4 w-4' />
							Total Configs
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-16' />
						) : (
							<CardTitle className='text-3xl'>
								{stats?.totalConfigs || 0}
							</CardTitle>
						)}
					</CardHeader>
				</Card>

				<Card className='border-l-4 border-l-purple-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconArrowsShuffle className='h-4 w-4' />
							Active Multipliers
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-16' />
						) : (
							<CardTitle className='text-3xl'>
								{stats?.activeMultipliers || 0}
							</CardTitle>
						)}
					</CardHeader>
				</Card>

				<Card className='border-l-4 border-l-orange-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCalendarEvent className='h-4 w-4' />
							Pending Events
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-16' />
						) : (
							<CardTitle className='text-3xl'>
								{stats?.pendingEvents || 0}
							</CardTitle>
						)}
					</CardHeader>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue='versions' className='space-y-4'>
				<TabsList className='overflow-x-auto'>
					<TabsTrigger value='versions'>
						<IconVersions className='h-4 w-4 mr-1.5' />
						Versions
					</TabsTrigger>
					<TabsTrigger value='configs'>
						<IconSettings className='h-4 w-4 mr-1.5' />
						Configs
					</TabsTrigger>
					<TabsTrigger value='surge'>
						<IconArrowsShuffle className='h-4 w-4 mr-1.5' />
						Surge
					</TabsTrigger>
					<TabsTrigger value='time'>
						<IconClock className='h-4 w-4 mr-1.5' />
						Time
					</TabsTrigger>
					<TabsTrigger value='weather'>
						<IconCloudRain className='h-4 w-4 mr-1.5' />
						Weather
					</TabsTrigger>
					<TabsTrigger value='events'>
						<IconCalendarEvent className='h-4 w-4 mr-1.5' />
						Events
					</TabsTrigger>
					<TabsTrigger value='zone-fees'>
						<IconMapPin className='h-4 w-4 mr-1.5' />
						Zone Fees
					</TabsTrigger>
					<TabsTrigger value='cancellation'>
						<IconBan className='h-4 w-4 mr-1.5' />
						Cancellation
					</TabsTrigger>
					<TabsTrigger value='preview'>
						<IconEye className='h-4 w-4 mr-1.5' />
						Preview
					</TabsTrigger>
					<TabsTrigger value='audit-logs'>
						<IconHistory className='h-4 w-4 mr-1.5' />
						Audit Logs
					</TabsTrigger>
				</TabsList>

				<TabsContent value='versions'>
					<PricingVersionsTab onRefresh={handleRefresh} />
				</TabsContent>

				<TabsContent value='configs'>
					{activeVersionId ? (
						<PricingConfigsTab versionId={activeVersionId} onRefresh={handleRefresh} />
					) : (
						<NoVersionMessage />
					)}
				</TabsContent>

				<TabsContent value='surge'>
					{activeVersionId ? (
						<PricingSurgeTab versionId={activeVersionId} onRefresh={handleRefresh} />
					) : (
						<NoVersionMessage />
					)}
				</TabsContent>

				<TabsContent value='time'>
					{activeVersionId ? (
						<PricingTimeMultipliersTab versionId={activeVersionId} onRefresh={handleRefresh} />
					) : (
						<NoVersionMessage />
					)}
				</TabsContent>

				<TabsContent value='weather'>
					{activeVersionId ? (
						<PricingWeatherMultipliersTab versionId={activeVersionId} onRefresh={handleRefresh} />
					) : (
						<NoVersionMessage />
					)}
				</TabsContent>

				<TabsContent value='events'>
					{activeVersionId ? (
						<PricingEventsTab versionId={activeVersionId} onRefresh={handleRefresh} />
					) : (
						<NoVersionMessage />
					)}
				</TabsContent>

				<TabsContent value='zone-fees'>
					{activeVersionId ? (
						<PricingZoneFeesTab versionId={activeVersionId} onRefresh={handleRefresh} />
					) : (
						<NoVersionMessage />
					)}
				</TabsContent>

				<TabsContent value='cancellation'>
					{activeVersionId ? (
						<PricingCancellationTiersTab versionId={activeVersionId} onRefresh={handleRefresh} />
					) : (
						<NoVersionMessage />
					)}
				</TabsContent>

				<TabsContent value='preview'>
					<PricingPreviewTool />
				</TabsContent>

				<TabsContent value='audit-logs'>
					<PricingAuditLogsTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
