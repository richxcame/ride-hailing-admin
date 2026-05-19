import Link from 'next/link';
import { IconError404 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center gap-4 p-8'>
			<IconError404 className='h-16 w-16 text-muted-foreground' />
			<h1 className='text-2xl font-semibold'>Page not found</h1>
			<p className='max-w-md text-center text-sm text-muted-foreground'>
				The page you are looking for doesn&apos;t exist or has been moved.
			</p>
			<Button asChild variant='outline'>
				<Link href='/dashboard'>Back to Dashboard</Link>
			</Button>
		</div>
	);
}
