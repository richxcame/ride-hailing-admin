'use client';

import { usePathname } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';

// Exact-path titles, longest paths first so nested routes match before parents.
const pageTitles: Record<string, string> = {
	'/dashboard/analytics': 'Analytics',
	'/dashboard/fraud/statistics': 'Fraud Statistics',
	'/dashboard/fraud': 'Fraud Detection',
	'/dashboard/users': 'Users',
	'/dashboard/drivers': 'Drivers',
	'/dashboard/rides': 'Rides',
	'/dashboard/vehicles': 'Vehicles',
	'/dashboard/documents': 'Documents',
	'/dashboard/earnings': 'Earnings & Payouts',
	'/dashboard/payments': 'Payments',
	'/dashboard/promos': 'Promos',
	'/dashboard/support': 'Support Tickets',
	'/dashboard/disputes': 'Disputes',
	'/dashboard/cancellations': 'Cancellations',
	'/dashboard/notifications': 'Notifications',
	'/dashboard/geography': 'Geography',
	'/dashboard/pricing': 'Pricing',
	'/dashboard/ride-types': 'Ride Types',
	'/dashboard/settings': 'Settings',
	'/dashboard': 'Dashboard',
};

// Singular labels used for dynamic detail routes (e.g. /dashboard/users/123).
const detailTitles: Record<string, string> = {
	Users: 'User Details',
	Drivers: 'Driver Details',
	Rides: 'Ride Details',
	Vehicles: 'Vehicle Details',
	'Fraud Detection': 'Fraud Alert Details',
	Promos: 'Promo Details',
};

export function SiteHeader() {
	const pathname = usePathname();

	const getPageTitle = () => {
		if (pageTitles[pathname]) {
			return pageTitles[pathname];
		}

		// Match the longest registered path that is a prefix of the current route.
		const match = Object.keys(pageTitles)
			.filter((path) => pathname.startsWith(`${path}/`))
			.sort((a, b) => b.length - a.length)[0];

		if (match) {
			const title = pageTitles[match];
			return detailTitles[title] ?? title;
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
				<div className='ml-auto flex items-center gap-2'>
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
