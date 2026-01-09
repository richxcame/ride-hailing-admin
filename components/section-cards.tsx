import { IconTrendingUp, IconUsers, IconCar, IconAlertTriangle } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardAction,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardStats } from '@/lib/types/models';

interface SectionCardsProps {
	stats?: DashboardStats;
	isLoading?: boolean;
}

export function SectionCards({ stats, isLoading }: SectionCardsProps) {
	if (isLoading) {
		return (
			<div className='grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
				{[...Array(4)].map((_, i) => (
					<Card key={i} className='@container/card'>
						<CardHeader>
							<Skeleton className='h-4 w-24' />
							<Skeleton className='h-8 w-32' />
						</CardHeader>
					</Card>
				))}
			</div>
		);
	}

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(value);
	};

	const formatNumber = (value: number) => {
		return new Intl.NumberFormat('en-US').format(value);
	};

	return (
		<div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
			<Card className='@container/card'>
				<CardHeader>
					<CardDescription>Total Revenue (30 days)</CardDescription>
					<CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
						{stats ? formatCurrency(stats.revenue_last_30_days) : '$0.00'}
					</CardTitle>
					<CardAction>
						<Badge variant='outline'>
							<IconTrendingUp />
							{stats ? formatCurrency(stats.total_revenue) : '$0'}
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className='flex-col items-start gap-1.5 text-sm'>
					<div className='line-clamp-1 flex gap-2 font-medium'>
						Total Rides: {stats ? formatNumber(stats.total_rides) : '0'}
					</div>
					<div className='text-muted-foreground'>
						Last 24h: {stats ? formatNumber(stats.rides_last_24h) : '0'} rides
					</div>
				</CardFooter>
			</Card>

			<Card className='@container/card'>
				<CardHeader>
					<CardDescription>Total Users</CardDescription>
					<CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
						{stats ? formatNumber(stats.total_users) : '0'}
					</CardTitle>
					<CardAction>
						<IconUsers className='size-5 text-muted-foreground' />
					</CardAction>
				</CardHeader>
				<CardFooter className='flex-col items-start gap-1.5 text-sm'>
					<div className='line-clamp-1 flex gap-2 font-medium'>
						Active Drivers: {stats ? formatNumber(stats.active_drivers) : '0'}
					</div>
					<div className='text-muted-foreground'>
						Currently online and available
					</div>
				</CardFooter>
			</Card>

			<Card className='@container/card'>
				<CardHeader>
					<CardDescription>Pending Driver Approvals</CardDescription>
					<CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
						{stats ? formatNumber(stats.pending_driver_approvals) : '0'}
					</CardTitle>
					<CardAction>
						<IconCar className='size-5 text-muted-foreground' />
					</CardAction>
				</CardHeader>
				<CardFooter className='flex-col items-start gap-1.5 text-sm'>
					<div className='line-clamp-1 flex gap-2 font-medium'>
						Requires review
					</div>
					<div className='text-muted-foreground'>
						New driver applications awaiting approval
					</div>
				</CardFooter>
			</Card>

			<Card className='@container/card'>
				<CardHeader>
					<CardDescription>Fraud Alerts</CardDescription>
					<CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
						{stats ? formatNumber(stats.fraud_alerts_count) : '0'}
					</CardTitle>
					<CardAction>
						<Badge variant='outline' className='border-destructive/50 text-destructive'>
							<IconAlertTriangle className='size-3.5' />
							Alerts
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className='flex-col items-start gap-1.5 text-sm'>
					<div className='line-clamp-1 flex gap-2 font-medium'>
						Requires attention
					</div>
					<div className='text-muted-foreground'>
						Pending fraud investigations
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
