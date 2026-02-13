'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type Icon } from '@tabler/icons-react';

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';

export interface NavItem {
	title: string;
	url: string;
	icon?: Icon;
}

export interface NavGroup {
	label: string;
	items: NavItem[];
}

export function NavMain({
	items,
	groups,
}: {
	items?: NavItem[];
	groups?: NavGroup[];
}) {
	const pathname = usePathname();

	const renderItems = (navItems: NavItem[]) =>
		navItems.map((item) => (
			<SidebarMenuItem key={item.title}>
				<SidebarMenuButton
					tooltip={item.title}
					asChild
					isActive={pathname === item.url || pathname.startsWith(`${item.url}/`)}
				>
					<Link href={item.url}>
						{item.icon && <item.icon />}
						<span>{item.title}</span>
					</Link>
				</SidebarMenuButton>
			</SidebarMenuItem>
		));

	// If groups are provided, render grouped navigation
	if (groups) {
		return (
			<>
				{groups.map((group) => (
					<SidebarGroup key={group.label}>
						<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>{renderItems(group.items)}</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</>
		);
	}

	// Fallback: flat list (backwards compatible)
	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>{renderItems(items || [])}</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
