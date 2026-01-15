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
					<CardDescription>Total Revenue</CardDescription>
					<CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
						{stats ? formatCurrency(stats.rides?.total_revenue || 0) : '$0.00'}
					</CardTitle>
					<CardAction>
						<Badge variant='outline'>
							<IconTrendingUp />
							Avg {stats ? formatCurrency(stats.rides?.avg_fare || 0) : '$0'}
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className='flex-col items-start gap-1.5 text-sm'>
					<div className='line-clamp-1 flex gap-2 font-medium'>
						Total Rides: {stats ? formatNumber(stats.rides?.total_rides || 0) : '0'}
					</div>
					<div className='text-muted-foreground'>
						Today: {stats ? formatNumber(stats.today_rides?.total_rides || 0) : '0'} rides
					</div>
				</CardFooter>
			</Card>

			<Card className='@container/card'>
				<CardHeader>
					<CardDescription>Total Users</CardDescription>
					<CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
						{stats ? formatNumber(stats.users?.total_users || 0) : '0'}
					</CardTitle>
					<CardAction>
						<IconUsers className='size-5 text-muted-foreground' />
					</CardAction>
				</CardHeader>
				<CardFooter className='flex-col items-start gap-1.5 text-sm'>
					<div className='line-clamp-1 flex gap-2 font-medium'>
						Active: {stats ? formatNumber(stats.users?.active_users || 0) : '0'}
					</div>
					<div className='text-muted-foreground'>
						{stats?.users?.total_riders || 0} riders, {stats?.users?.total_drivers || 0} drivers
					</div>
				</CardFooter>
			</Card>

			<Card className='@container/card'>
				<CardHeader>
					<CardDescription>Today&apos;s Rides</CardDescription>
					<CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
						{stats ? formatNumber(stats.today_rides?.total_rides || 0) : '0'}
					</CardTitle>
					<CardAction>
						<IconCar className='size-5 text-muted-foreground' />
					</CardAction>
				</CardHeader>
				<CardFooter className='flex-col items-start gap-1.5 text-sm'>
					<div className='line-clamp-1 flex gap-2 font-medium'>
						Completed: {stats ? formatNumber(stats.today_rides?.completed_rides || 0) : '0'}
					</div>
					<div className='text-muted-foreground'>
						Active: {stats?.today_rides?.active_rides || 0}, Cancelled: {stats?.today_rides?.cancelled_rides || 0}
					</div>
				</CardFooter>
			</Card>

			<Card className='@container/card'>
				<CardHeader>
					<CardDescription>Today&apos;s Revenue</CardDescription>
					<CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
						{stats ? formatCurrency(stats.today_rides?.total_revenue || 0) : '$0.00'}
					</CardTitle>
					<CardAction>
						<Badge variant='outline'>
							<IconTrendingUp className='size-3.5' />
							Avg {stats ? formatCurrency(stats.today_rides?.avg_fare || 0) : '$0'}
						</Badge>
					</CardAction>
				</CardHeader>
				<CardFooter className='flex-col items-start gap-1.5 text-sm'>
					<div className='line-clamp-1 flex gap-2 font-medium'>
						From completed rides
					</div>
					<div className='text-muted-foreground'>
						{stats?.today_rides?.completed_rides || 0} rides completed today
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}
