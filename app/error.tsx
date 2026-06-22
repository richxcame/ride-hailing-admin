'use client';

import { useEffect } from 'react';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

// Root error boundary — catches render/runtime errors anywhere in the app that
// the per-segment boundaries (e.g. app/dashboard/error.tsx) don't already cover.
export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error('Application error:', error);
	}, [error]);

	return (
		<div className='flex min-h-screen flex-col items-center justify-center gap-4 p-8'>
			<IconAlertTriangle className='h-12 w-12 text-destructive' />
			<h2 className='text-xl font-semibold'>Something went wrong</h2>
			<p className='max-w-md text-center text-sm text-muted-foreground'>
				An unexpected error occurred. Please try again — if it keeps happening, contact
				support with the reference below.
			</p>
			{error.digest && (
				<code className='rounded bg-muted px-2 py-1 text-xs text-muted-foreground'>
					ref: {error.digest}
				</code>
			)}
			<Button onClick={reset} variant='outline'>
				<IconRefresh className='mr-2 h-4 w-4' />
				Try again
			</Button>
		</div>
	);
}
