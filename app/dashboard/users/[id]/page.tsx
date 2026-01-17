'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import {
	IconArrowLeft,
	IconMail,
	IconPhone,
	IconCalendar,
	IconUserCheck,
	IconUserOff,
	IconShield,
	IconId,
	IconCopy,
	IconRefresh,
	IconEdit,
} from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import { User } from '@/lib/types/models';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function UserDetailPage() {
	const params = useParams();
	const router = useRouter();
	const userId = params.id as string;

	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Suspend dialog state
	const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
	const [suspendReason, setSuspendReason] = useState('');
	const [isSuspending, setIsSuspending] = useState(false);

	// Activate dialog state
	const [activateDialogOpen, setActivateDialogOpen] = useState(false);
	const [isActivating, setIsActivating] = useState(false);

	const fetchUser = async () => {
		try {
			setIsLoading(true);
			const userData = await adminService.getUser(userId);
			setUser(userData);
		} catch (error) {
			toast.error('Failed to load user details');
			router.push('/dashboard/users');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (userId) {
			fetchUser();
		}
	}, [userId]);

	const handleRefresh = () => {
		fetchUser();
		toast.success('User details refreshed');
	};

	// Confirm suspend
	const handleConfirmSuspend = async () => {
		if (!user || !suspendReason.trim()) {
			toast.error('Please provide a reason for suspension');
			return;
		}

		try {
			setIsSuspending(true);
			await adminService.suspendUser(user.id, {
				reason: suspendReason,
			});
			toast.success('User suspended successfully');
			setSuspendDialogOpen(false);
			setSuspendReason('');
			setUser({ ...user, is_active: false });
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

	// Confirm activate
	const handleConfirmActivate = async () => {
		if (!user) return;

		try {
			setIsActivating(true);
			await adminService.activateUser(user.id);
			toast.success('User activated successfully');
			setActivateDialogOpen(false);
			setUser({ ...user, is_active: true });
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

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied to clipboard`);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const roleColors = {
		admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
		driver: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
		rider: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
	};

	if (isLoading) {
		return (
			<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
				<div className='flex items-center gap-4'>
					<Skeleton className='h-10 w-10' />
					<Skeleton className='h-8 w-48' />
				</div>
				<div className='grid gap-4 md:grid-cols-2'>
					<Skeleton className='h-64' />
					<Skeleton className='h-64' />
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className='flex flex-1 flex-col items-center justify-center gap-4 p-4'>
				<h2 className='text-xl font-semibold'>User not found</h2>
				<Button asChild>
					<Link href='/dashboard/users'>
						<IconArrowLeft className='h-4 w-4 mr-2' />
						Back to Users
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<Button variant='outline' size='icon' asChild>
						<Link href='/dashboard/users'>
							<IconArrowLeft className='h-4 w-4' />
						</Link>
					</Button>
					<div>
						<h1 className='text-2xl font-semibold tracking-tight'>
							{user.first_name} {user.last_name}
						</h1>
						<p className='text-sm text-muted-foreground'>
							User details and management
						</p>
					</div>
				</div>
				<div className='flex gap-2'>
					<Button variant='outline' size='sm' onClick={handleRefresh}>
						<IconRefresh className='h-4 w-4' />
						Refresh
					</Button>
				</div>
			</div>

			<div className='grid gap-4 md:grid-cols-3'>
				{/* Profile Card */}
				<Card className='md:col-span-1'>
					<CardHeader>
						<CardTitle>Profile</CardTitle>
						<CardDescription>User profile information</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						{/* Avatar & Name */}
						<div className='flex flex-col items-center text-center'>
							<Avatar className='h-24 w-24 mb-4'>
								<AvatarImage src={user.profile_image} alt={user.first_name} />
								<AvatarFallback className='text-2xl'>
									{user.first_name.charAt(0)}
									{user.last_name.charAt(0)}
								</AvatarFallback>
							</Avatar>
							<h3 className='text-xl font-semibold'>
								{user.first_name} {user.last_name}
							</h3>
							<p className='text-sm text-muted-foreground'>{user.email}</p>
							<div className='flex items-center gap-2 mt-3'>
								<Badge
									variant='outline'
									className={roleColors[user.role as keyof typeof roleColors]}
								>
									{user.role.charAt(0).toUpperCase() + user.role.slice(1)}
								</Badge>
								<Badge variant={user.is_active ? 'default' : 'secondary'}>
									{user.is_active ? 'Active' : 'Inactive'}
								</Badge>
							</div>
						</div>

						<Separator />

						{/* Quick Actions */}
						<div className='space-y-2'>
							{user.is_active ? (
								<Button
									variant='destructive'
									className='w-full'
									onClick={() => setSuspendDialogOpen(true)}
								>
									<IconUserOff className='h-4 w-4 mr-2' />
									Suspend User
								</Button>
							) : (
								<Button
									variant='default'
									className='w-full bg-green-600 hover:bg-green-700'
									onClick={() => setActivateDialogOpen(true)}
								>
									<IconUserCheck className='h-4 w-4 mr-2' />
									Activate User
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Details Card */}
				<Card className='md:col-span-2'>
					<CardHeader>
						<CardTitle>User Details</CardTitle>
						<CardDescription>Complete user information</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						{/* Contact Information */}
						<div className='space-y-4'>
							<h4 className='text-sm font-medium text-muted-foreground'>Contact Information</h4>
							<div className='grid gap-4 md:grid-cols-2'>
								<div className='flex items-center justify-between rounded-lg border p-4'>
									<div className='flex items-center gap-3'>
										<IconMail className='h-5 w-5 text-muted-foreground' />
										<div>
											<p className='text-sm font-medium'>Email</p>
											<p className='text-sm text-muted-foreground'>{user.email}</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										onClick={() => copyToClipboard(user.email, 'Email')}
									>
										<IconCopy className='h-4 w-4' />
									</Button>
								</div>

								<div className='flex items-center justify-between rounded-lg border p-4'>
									<div className='flex items-center gap-3'>
										<IconPhone className='h-5 w-5 text-muted-foreground' />
										<div>
											<p className='text-sm font-medium'>Phone</p>
											<p className='text-sm text-muted-foreground'>{user.phone_number}</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										onClick={() => copyToClipboard(user.phone_number, 'Phone')}
									>
										<IconCopy className='h-4 w-4' />
									</Button>
								</div>
							</div>
						</div>

						<Separator />

						{/* Account Information */}
						<div className='space-y-4'>
							<h4 className='text-sm font-medium text-muted-foreground'>Account Information</h4>
							<div className='grid gap-4 md:grid-cols-2'>
								<div className='flex items-center justify-between rounded-lg border p-4'>
									<div className='flex items-center gap-3'>
										<IconId className='h-5 w-5 text-muted-foreground' />
										<div>
											<p className='text-sm font-medium'>User ID</p>
											<p className='text-xs text-muted-foreground font-mono truncate max-w-[180px]'>
												{user.id}
											</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										onClick={() => copyToClipboard(user.id, 'User ID')}
									>
										<IconCopy className='h-4 w-4' />
									</Button>
								</div>

								<div className='flex items-center gap-3 rounded-lg border p-4'>
									<IconShield className='h-5 w-5 text-muted-foreground' />
									<div>
										<p className='text-sm font-medium'>Role</p>
										<p className='text-sm text-muted-foreground capitalize'>{user.role}</p>
									</div>
								</div>

								<div className='flex items-center gap-3 rounded-lg border p-4'>
									<IconCalendar className='h-5 w-5 text-muted-foreground' />
									<div>
										<p className='text-sm font-medium'>Joined</p>
										<p className='text-sm text-muted-foreground'>{formatDate(user.created_at)}</p>
									</div>
								</div>

								<div className='flex items-center gap-3 rounded-lg border p-4'>
									<IconCalendar className='h-5 w-5 text-muted-foreground' />
									<div>
										<p className='text-sm font-medium'>Last Updated</p>
										<p className='text-sm text-muted-foreground'>{formatDate(user.updated_at)}</p>
									</div>
								</div>
							</div>
						</div>

						<Separator />

						{/* Status */}
						<div className='space-y-4'>
							<h4 className='text-sm font-medium text-muted-foreground'>Account Status</h4>
							<div className='grid gap-4 md:grid-cols-3'>
								<div className='rounded-lg border p-4'>
									<p className='text-sm text-muted-foreground'>Status</p>
									<p className='text-lg font-semibold'>
										{user.is_active ? (
											<span className='text-green-600'>Active</span>
										) : (
											<span className='text-red-600'>Suspended</span>
										)}
									</p>
								</div>
								<div className='rounded-lg border p-4'>
									<p className='text-sm text-muted-foreground'>Verified</p>
									<p className='text-lg font-semibold'>
										{user.is_verified ? (
											<span className='text-green-600'>Yes</span>
										) : (
											<span className='text-yellow-600'>No</span>
										)}
									</p>
								</div>
								<div className='rounded-lg border p-4'>
									<p className='text-sm text-muted-foreground'>Account Type</p>
									<p className='text-lg font-semibold capitalize'>{user.role}</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

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
								{user.first_name} {user.last_name}
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
								{user.first_name} {user.last_name}
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
