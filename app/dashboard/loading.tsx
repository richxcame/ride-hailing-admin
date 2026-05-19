import { Skeleton } from '@/components/ui/skeleton';

/**
 * Route-level loading UI shown during navigation between dashboard pages.
 */
export default function DashboardLoading() {
	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:p-6'>
			<Skeleton className='h-8 w-48' />
			<div className='grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
				{[...Array(4)].map((_, i) => (
					<Skeleton key={i} className='h-28 w-full' />
				))}
			</div>
			<Skeleton className='h-64 w-full' />
			<Skeleton className='h-96 w-full' />
		</div>
	);
}
