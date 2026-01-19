'use client';

import * as React from 'react';
import {
	IconAlertTriangle,
	IconCar,
	IconChartBar,
	IconDashboard,
	IconHelp,
	IconListDetails,
	IconSearch,
	IconSettings,
	IconTag,
	IconUsers,
} from '@tabler/icons-react';
import Image from 'next/image';

import { NavMain } from '@/components/nav-main';
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

const data = {
	navMain: [
		{
			title: 'Dashboard',
			url: '/dashboard',
			icon: IconDashboard,
		},
		{
			title: 'Users',
			url: '/dashboard/users',
			icon: IconUsers,
		},
		{
			title: 'Drivers',
			url: '/dashboard/drivers',
			icon: IconCar,
		},
		{
			title: 'Rides',
			url: '/dashboard/rides',
			icon: IconListDetails,
		},
		{
			title: 'Analytics',
			url: '/dashboard/analytics',
			icon: IconChartBar,
		},
		{
			title: 'Fraud Detection',
			url: '/dashboard/fraud',
			icon: IconAlertTriangle,
		},
		{
			title: 'Promos',
			url: '/dashboard/promos',
			icon: IconTag,
		},
	],
	navSecondary: [
		{
			title: 'Settings',
			url: '#',
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
	],
};

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
				<NavMain items={data.navMain} />
				<NavSecondary items={data.navSecondary} className='mt-auto' />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={userData} />
			</SidebarFooter>
		</Sidebar>
	);
}
