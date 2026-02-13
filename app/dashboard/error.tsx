'use client';

import { useEffect } from 'react';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error('Dashboard error:', error);
	}, [error]);

	return (
		<div className='flex flex-1 flex-col items-center justify-center gap-4 p-8'>
			<IconAlertTriangle className='h-12 w-12 text-destructive' />
			<h2 className='text-xl font-semibold'>Something went wrong</h2>
			<p className='text-sm text-muted-foreground text-center max-w-md'>
				An unexpected error occurred while loading this page. Please try again.
			</p>
			<Button onClick={reset} variant='outline'>
				<IconRefresh className='mr-2 h-4 w-4' />
				Try again
			</Button>
		</div>
	);
}
