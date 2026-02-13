'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
	IconRefresh,
	IconUsers,
	IconUserCheck,
	IconUserOff,
	IconSearch,
	IconSteeringWheel,
	IconUserPlus,
	IconShieldCheck,
} from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import { User } from '@/lib/types/models';
import { UsersTable } from '@/components/users-table';
import { UserDetailSheet } from '@/components/user-detail-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface UserStats {
	total: number;
	riders: number;
	drivers: number;
	admins: number;
	active: number;
	inactive: number;
}

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [roleFilter, setRoleFilter] = useState<string>('all');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [pagination, setPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});
	const [stats, setStats] = useState<UserStats | null>(null);
	const [isLoadingStats, setIsLoadingStats] = useState(true);

	// User detail sheet state
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

	// Suspend dialog state
	const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
	const [suspendReason, setSuspendReason] = useState('');
	const [userToSuspend, setUserToSuspend] = useState<User | null>(null);
	const [isSuspending, setIsSuspending] = useState(false);

	// Activate dialog state
	const [activateDialogOpen, setActivateDialogOpen] = useState(false);
	const [userToActivate, setUserToActivate] = useState<User | null>(null);
	const [isActivating, setIsActivating] = useState(false);

	// Stats will be fetched with the initial users query
	const fetchStats = useCallback(async () => {
		try {
			setIsLoadingStats(true);
			// Fetch users with no filters to get full stats
			const response = await adminService.getUsers({ limit: 1 });

			// Extract stats from meta
			if (response.meta.stats) {
				const s = response.meta.stats;
				const total = Number(s.total_users) || 0;
				const active = Number(s.active_users) || 0;
				setStats({
					total,
					riders: Number(s.total_riders) || 0,
					drivers: Number(s.total_drivers) || 0,
					admins: Number(s.total_admins) || 0,
					active,
					inactive: total - active,
				});
			}
		} catch (error) {
			console.error('Failed to fetch stats:', error);
		} finally {
			setIsLoadingStats(false);
		}
	}, []);

	const fetchUsers = useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await adminService.getUsers({
				limit: pagination.limit,
				offset: pagination.offset,
				...(roleFilter !== 'all' && { role: roleFilter }),
				...(statusFilter !== 'all' && { status: statusFilter as 'active' | 'inactive' }),
				...(searchQuery && { search: searchQuery }),
			});

			setUsers(response.data);
			setPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to load users';
			toast.error('Failed to load users', {
				description: errorMessage,
			});
		} finally {
			setIsLoading(false);
		}
	}, [pagination.limit, pagination.offset, roleFilter, statusFilter, searchQuery]);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	useEffect(() => {
		fetchUsers();
	}, [pagination.offset, pagination.limit, roleFilter, statusFilter]);

	const handleSearch = () => {
		setPagination((prev) => ({ ...prev, offset: 0 }));
		fetchUsers();
	};

	const handleRefresh = () => {
		fetchUsers();
		fetchStats();
		toast.success('Users refreshed');
	};

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	// View user details
	const handleViewUser = async (userId: string) => {
		try {
			const user = await adminService.getUser(userId);
			setSelectedUser(user);
			setIsDetailSheetOpen(true);
		} catch (error) {
			toast.error('Failed to load user details');
		}
	};

	// Open suspend dialog
	const handleSuspendClick = (user: User) => {
		setUserToSuspend(user);
		setSuspendReason('');
		setSuspendDialogOpen(true);
	};

	// Confirm suspend
	const handleConfirmSuspend = async () => {
		if (!userToSuspend || !suspendReason.trim()) {
			toast.error('Please provide a reason for suspension');
			return;
		}

		try {
			setIsSuspending(true);
			await adminService.suspendUser(userToSuspend.id, {
				reason: suspendReason,
			});
			toast.success('User suspended successfully', {
				description: `${userToSuspend.first_name} ${userToSuspend.last_name} has been suspended.`,
			});
			setSuspendDialogOpen(false);
			setUserToSuspend(null);
			setSuspendReason('');
			fetchUsers();
			fetchStats();

			// Update detail sheet if open
			if (selectedUser?.id === userToSuspend.id) {
				setSelectedUser({ ...selectedUser, is_active: false });
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to suspend user';
			toast.error('Failed to suspend user', {
				description: errorMessage,
			});
		} finally {
			setIsSuspending(false);
		}
	};

	// Open activate dialog
	const handleActivateClick = (user: User) => {
		setUserToActivate(user);
		setActivateDialogOpen(true);
	};

	// Confirm activate
	const handleConfirmActivate = async () => {
		if (!userToActivate) return;

		try {
			setIsActivating(true);
			await adminService.activateUser(userToActivate.id);
			toast.success('User activated successfully', {
				description: `${userToActivate.first_name} ${userToActivate.last_name} has been activated.`,
			});
			setActivateDialogOpen(false);
			setUserToActivate(null);
			fetchUsers();
			fetchStats();

			// Update detail sheet if open
			if (selectedUser?.id === userToActivate.id) {
				setSelectedUser({ ...selectedUser, is_active: true });
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to activate user';
			toast.error('Failed to activate user', {
				description: errorMessage,
			});
		} finally {
			setIsActivating(false);
		}
	};

	// Handle user action from table
	const handleUserAction = (action: 'suspend' | 'activate' | 'view', userId: string) => {
		const user = users.find((u) => u.id === userId);
		if (!user) return;

		if (action === 'view') {
			handleViewUser(userId);
		} else if (action === 'suspend') {
			handleSuspendClick(user);
		} else if (action === 'activate') {
			handleActivateClick(user);
		}
	};

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Users</h1>
					<p className='text-sm text-muted-foreground'>
						Manage all users in the system
					</p>
				</div>
				<Button variant='outline' size='sm' onClick={handleRefresh}>
					<IconRefresh className='h-4 w-4' />
					Refresh
				</Button>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconUsers className='h-4 w-4' />
							Total Users
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl'>{stats?.total || 0}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>All registered users</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconUserCheck className='h-4 w-4 text-green-600' />
							Active Users
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-green-600'>{stats?.active || 0}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Currently active</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconUserPlus className='h-4 w-4' />
							Riders
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl'>{stats?.riders || 0}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Registered riders</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconSteeringWheel className='h-4 w-4' />
							Drivers
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl'>{stats?.drivers || 0}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Registered drivers</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconShieldCheck className='h-4 w-4' />
							Admins
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl'>{stats?.admins || 0}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>System administrators</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters & Table */}
			<Card>
				<CardHeader>
					<CardTitle>All Users</CardTitle>
					<CardDescription>
						Search and manage users across the platform
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					{/* Filters */}
					<div className='flex flex-col gap-4 md:flex-row md:items-center'>
						<div className='flex-1'>
							<div className='relative'>
								<IconSearch className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
								<Input
									placeholder='Search by email, name, or phone...'
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											handleSearch();
										}
									}}
									className='pl-9 max-w-md'
								/>
							</div>
						</div>
						<div className='flex gap-2'>
							<Select value={roleFilter} onValueChange={setRoleFilter}>
								<SelectTrigger className='w-[130px]'>
									<SelectValue placeholder='Role' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Roles</SelectItem>
									<SelectItem value='rider'>Riders</SelectItem>
									<SelectItem value='driver'>Drivers</SelectItem>
									<SelectItem value='admin'>Admins</SelectItem>
								</SelectContent>
							</Select>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className='w-[130px]'>
									<SelectValue placeholder='Status' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Status</SelectItem>
									<SelectItem value='active'>Active</SelectItem>
									<SelectItem value='inactive'>Inactive</SelectItem>
								</SelectContent>
							</Select>
							<Button onClick={handleSearch}>Search</Button>
						</div>
					</div>

					{/* Users Table */}
					<UsersTable
						users={users}
						isLoading={isLoading}
						pagination={pagination}
						onPageChange={handlePageChange}
						onUserAction={handleUserAction}
					/>
				</CardContent>
			</Card>

			{/* User Detail Sheet */}
			<UserDetailSheet
				user={selectedUser}
				open={isDetailSheetOpen}
				onOpenChange={setIsDetailSheetOpen}
				onSuspend={() => selectedUser && handleSuspendClick(selectedUser)}
				onActivate={() => selectedUser && handleActivateClick(selectedUser)}
			/>

			{/* Suspend Confirmation Dialog */}
			<AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<IconUserOff className='h-5 w-5 text-destructive' />
							Suspend User
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to suspend{' '}
							<span className='font-medium'>
								{userToSuspend?.first_name} {userToSuspend?.last_name}
							</span>
							? This will prevent them from accessing the platform.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className='space-y-2 py-4'>
						<Label htmlFor='suspend-reason'>Reason for suspension</Label>
						<Textarea
							id='suspend-reason'
							placeholder='Enter the reason for suspending this user...'
							value={suspendReason}
							onChange={(e) => setSuspendReason(e.target.value)}
							rows={3}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSuspending}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmSuspend}
							disabled={isSuspending || !suspendReason.trim()}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							{isSuspending ? 'Suspending...' : 'Suspend User'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Activate Confirmation Dialog */}
			<AlertDialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<IconUserCheck className='h-5 w-5 text-green-600' />
							Activate User
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to activate{' '}
							<span className='font-medium'>
								{userToActivate?.first_name} {userToActivate?.last_name}
							</span>
							? This will restore their access to the platform.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isActivating}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmActivate}
							disabled={isActivating}
							className='bg-green-600 text-white hover:bg-green-700'
						>
							{isActivating ? 'Activating...' : 'Activate User'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
