'use client';

import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

const pageTitles: Record<string, string> = {
	'/dashboard': 'Dashboard',
	'/dashboard/users': 'Users',
	'/dashboard/drivers': 'Drivers',
	'/dashboard/rides': 'Rides',
	'/dashboard/analytics': 'Analytics',
	'/dashboard/fraud': 'Fraud Detection',
	'/dashboard/fraud/statistics': 'Fraud Statistics',
	'/dashboard/promos': 'Promos',
	'/dashboard/settings': 'Settings',
};

export function SiteHeader() {
	const pathname = usePathname();

	// Get title based on current path
	const getPageTitle = () => {
		// Check for exact match first
		if (pageTitles[pathname]) {
			return pageTitles[pathname];
		}

		// Check for detail pages (e.g., /dashboard/users/123)
		for (const [path, title] of Object.entries(pageTitles)) {
			if (pathname.startsWith(`${path}/`)) {
				// Return singular form for detail pages
				if (title === 'Users') return 'User Details';
				if (title === 'Drivers') return 'Driver Details';
				if (title === 'Rides') return 'Ride Details';
				if (title === 'Fraud Detection') return 'Fraud Alert Details';
				return title;
			}
		}

		return 'Dashboard';
	};

	return (
		<header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
			<div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
				<SidebarTrigger className='-ml-1' />
				<Separator
					orientation='vertical'
					className='mx-2 data-[orientation=vertical]:h-4'
				/>
				<h1 className='text-base font-medium'>{getPageTitle()}</h1>
			</div>
		</header>
	);
}
