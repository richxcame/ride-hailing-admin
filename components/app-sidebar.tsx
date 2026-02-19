'use client';

import * as React from 'react';
import {
	IconAlertTriangle,
	IconBan,
	IconBell,
	IconCar,
	IconCategory,
	IconChartBar,
	IconCreditCard,
	IconDashboard,
	IconFileCheck,
	IconGavel,
	IconHelp,
	IconListDetails,
	IconReceipt,
	IconSearch,
	IconSettings,
	IconTag,
	IconTicket,
	IconTruck,
	IconUsers,
	IconWallet,
	IconWorld,
} from '@tabler/icons-react';
import Image from 'next/image';

import { NavMain, type NavGroup } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';

const navGroups: NavGroup[] = [
	{
		label: 'Overview',
		items: [
			{ title: 'Dashboard', url: '/dashboard', icon: IconDashboard },
			{ title: 'Analytics', url: '/dashboard/analytics', icon: IconChartBar },
		],
	},
	{
		label: 'Operations',
		items: [
			{ title: 'Rides', url: '/dashboard/rides', icon: IconListDetails },
			{ title: 'Users', url: '/dashboard/users', icon: IconUsers },
			{ title: 'Drivers', url: '/dashboard/drivers', icon: IconCar },
			{ title: 'Vehicles', url: '/dashboard/vehicles', icon: IconTruck },
			{ title: 'Documents', url: '/dashboard/documents', icon: IconFileCheck },
		],
	},
	{
		label: 'Finance',
		items: [
			{ title: 'Earnings & Payouts', url: '/dashboard/earnings', icon: IconWallet },
			{ title: 'Payments', url: '/dashboard/payments', icon: IconCreditCard },
			{ title: 'Promos', url: '/dashboard/promos', icon: IconTag },
		],
	},
	{
		label: 'Customer Support',
		items: [
			{ title: 'Support Tickets', url: '/dashboard/support', icon: IconTicket },
			{ title: 'Disputes', url: '/dashboard/disputes', icon: IconGavel },
			{ title: 'Cancellations', url: '/dashboard/cancellations', icon: IconBan },
		],
	},
	{
		label: 'Safety',
		items: [
			{ title: 'Fraud Detection', url: '/dashboard/fraud', icon: IconAlertTriangle },
			{ title: 'Notifications', url: '/dashboard/notifications', icon: IconBell },
		],
	},
	{
		label: 'Configuration',
		items: [
			{ title: 'Geography', url: '/dashboard/geography', icon: IconWorld },
			{ title: 'Pricing', url: '/dashboard/pricing', icon: IconReceipt },
			{ title: 'Ride Types', url: '/dashboard/ride-types', icon: IconCategory },
		],
	},
];

const navSecondary = [
	{
		title: 'Settings',
		url: '/dashboard/settings',
		icon: IconSettings,
	},
	{
		title: 'Get Help',
		url: '#',
		icon: IconHelp,
	},
	{
		title: 'Search',
		url: '#',
		icon: IconSearch,
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user } = useAuth();

	const userData = user
		? {
				name: `${user.first_name} ${user.last_name}`,
				email: user.email,
				avatar: user.profile_image || '/avatars/shadcn.jpg',
			}
		: {
				name: 'MonteGo Admin',
				email: 'admin@montego.com',
				avatar: '/avatars/shadcn.jpg',
			};

	return (
		<Sidebar collapsible='offExamples' {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className='data-[slot=sidebar-menu-button]:p-1.5!'
						>
							<a href='/dashboard'>
								<Image
									src='/montego.png'
									alt='MonteGo Logo'
									width={150}
									height={50}
									className='mx-auto'
								/>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain groups={navGroups} />
				<NavSecondary items={navSecondary} className='mt-auto' />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={userData} />
			</SidebarFooter>
		</Sidebar>
	);
}
