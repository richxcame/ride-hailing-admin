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
	IconUserX,
	IconId,
	IconCopy,
	IconRefresh,
	IconCar,
	IconLicense,
	IconStar,
	IconRoute,
	IconCloudCheck,
	IconCloudOff,
	IconMapPin,
} from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import { Driver } from '@/lib/types/models';
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

export default function DriverDetailPage() {
	const params = useParams();
	const router = useRouter();
	const driverId = params.id as string;

	const [driver, setDriver] = useState<Driver | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Approve dialog state
	const [approveDialogOpen, setApproveDialogOpen] = useState(false);
	const [approveNotes, setApproveNotes] = useState('');
	const [isApproving, setIsApproving] = useState(false);

	// Reject dialog state
	const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
	const [rejectReason, setRejectReason] = useState('');
	const [isRejecting, setIsRejecting] = useState(false);

	const fetchDriver = async () => {
		try {
			setIsLoading(true);
			const driverData = await adminService.getDriver(driverId);
			setDriver(driverData);
		} catch (error) {
			toast.error('Failed to load driver details');
			router.push('/dashboard/drivers');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (driverId) {
			fetchDriver();
		}
	}, [driverId]);

	const handleRefresh = () => {
		fetchDriver();
		toast.success('Driver details refreshed');
	};

	// Confirm approve
	const handleConfirmApprove = async () => {
		if (!driver) return;

		try {
			setIsApproving(true);
			await adminService.approveDriver(driver.id, {
				notes: approveNotes || 'Approved via admin panel',
			});
			toast.success('Driver approved successfully');
			setApproveDialogOpen(false);
			setApproveNotes('');
			setDriver({ ...driver, is_available: true });
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to approve driver';
			toast.error('Failed to approve driver', {
				description: errorMessage,
			});
		} finally {
			setIsApproving(false);
		}
	};

	// Confirm reject
	const handleConfirmReject = async () => {
		if (!driver || !rejectReason.trim()) {
			toast.error('Please provide a reason for rejection');
			return;
		}

		try {
			setIsRejecting(true);
			await adminService.rejectDriver(driver.id, {
				reason: rejectReason,
			});
			toast.success('Driver application rejected');
			setRejectDialogOpen(false);
			setRejectReason('');
			router.push('/dashboard/drivers');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to reject driver';
			toast.error('Failed to reject driver', {
				description: errorMessage,
			});
		} finally {
			setIsRejecting(false);
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

	if (!driver) {
		return (
			<div className='flex flex-1 flex-col items-center justify-center gap-4 p-4'>
				<h2 className='text-xl font-semibold'>Driver not found</h2>
				<Button asChild>
					<Link href='/dashboard/drivers'>
						<IconArrowLeft className='h-4 w-4 mr-2' />
						Back to Drivers
					</Link>
				</Button>
			</div>
		);
	}

	const isPending = !driver.is_available;

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<Button variant='outline' size='icon' asChild>
						<Link href='/dashboard/drivers'>
							<IconArrowLeft className='h-4 w-4' />
						</Link>
					</Button>
					<div>
						<h1 className='text-2xl font-semibold tracking-tight'>
							{driver.user?.first_name} {driver.user?.last_name}
						</h1>
						<p className='text-sm text-muted-foreground'>
							Driver details and management
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
						<CardDescription>Driver profile information</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						{/* Avatar & Name */}
						<div className='flex flex-col items-center text-center'>
							<Avatar className='h-24 w-24 mb-4'>
								<AvatarImage src={driver.user?.profile_image} alt={driver.user?.first_name} />
								<AvatarFallback className='text-2xl'>
									{driver.user?.first_name?.charAt(0)}
									{driver.user?.last_name?.charAt(0)}
								</AvatarFallback>
							</Avatar>
							<h3 className='text-xl font-semibold'>
								{driver.user?.first_name} {driver.user?.last_name}
							</h3>
							<p className='text-sm text-muted-foreground'>{driver.user?.email}</p>
							<div className='flex items-center gap-2 mt-3'>
								{isPending ? (
									<Badge variant='outline' className='border-orange-500 text-orange-600'>
										Pending Approval
									</Badge>
								) : (
									<>
										<Badge variant='default'>Approved</Badge>
										<Badge
											variant={driver.is_online ? 'default' : 'secondary'}
											className={driver.is_online ? 'bg-green-600' : ''}
										>
											{driver.is_online ? 'Online' : 'Offline'}
										</Badge>
									</>
								)}
							</div>
						</div>

						{/* Stats */}
						{!isPending && (
							<>
								<Separator />
								<div className='grid grid-cols-2 gap-4 text-center'>
									<div>
										<div className='flex items-center justify-center gap-1'>
											<IconStar className='h-5 w-5 text-yellow-500' />
											<span className='text-2xl font-bold'>
												{driver.rating?.toFixed(1) || 'N/A'}
											</span>
										</div>
										<p className='text-xs text-muted-foreground'>Rating</p>
									</div>
									<div>
										<div className='flex items-center justify-center gap-1'>
											<IconRoute className='h-5 w-5 text-blue-500' />
											<span className='text-2xl font-bold'>
												{driver.total_rides || 0}
											</span>
										</div>
										<p className='text-xs text-muted-foreground'>Total Rides</p>
									</div>
								</div>
							</>
						)}

						<Separator />

						{/* Quick Actions */}
						<div className='space-y-2'>
							{isPending ? (
								<div className='flex gap-2'>
									<Button
										variant='destructive'
										className='flex-1'
										onClick={() => setRejectDialogOpen(true)}
									>
										<IconUserX className='h-4 w-4 mr-2' />
										Reject
									</Button>
									<Button
										className='flex-1 bg-green-600 hover:bg-green-700'
										onClick={() => setApproveDialogOpen(true)}
									>
										<IconUserCheck className='h-4 w-4 mr-2' />
										Approve
									</Button>
								</div>
							) : (
								<Button variant='outline' className='w-full' asChild>
									<Link href={`/dashboard/drivers/${driver.id}/rides`}>
										<IconRoute className='h-4 w-4 mr-2' />
										View Ride History
									</Link>
								</Button>
							)}
						</div>
					</CardContent>
				</Card>

				{/* Details Card */}
				<Card className='md:col-span-2'>
					<CardHeader>
						<CardTitle>Driver Details</CardTitle>
						<CardDescription>Complete driver information</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						{/* Vehicle Information */}
						<div className='space-y-4'>
							<h4 className='text-sm font-medium text-muted-foreground'>Vehicle Information</h4>
							<div className='grid gap-4 md:grid-cols-2'>
								<div className='flex items-center gap-3 rounded-lg border p-4'>
									<IconCar className='h-5 w-5 text-muted-foreground' />
									<div>
										<p className='text-sm font-medium'>Vehicle</p>
										<p className='text-sm text-muted-foreground'>
											{driver.vehicle_year} {driver.vehicle_model}
										</p>
									</div>
								</div>

								<div className='flex items-center gap-3 rounded-lg border p-4'>
									<div
										className='h-5 w-5 rounded-full border'
										style={{ backgroundColor: driver.vehicle_color }}
									/>
									<div>
										<p className='text-sm font-medium'>Color</p>
										<p className='text-sm text-muted-foreground capitalize'>
											{driver.vehicle_color}
										</p>
									</div>
								</div>

								<div className='flex items-center justify-between rounded-lg border p-4'>
									<div className='flex items-center gap-3'>
										<IconLicense className='h-5 w-5 text-muted-foreground' />
										<div>
											<p className='text-sm font-medium'>License Plate</p>
											<p className='text-sm text-muted-foreground'>{driver.vehicle_plate}</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										onClick={() => copyToClipboard(driver.vehicle_plate, 'License plate')}
									>
										<IconCopy className='h-4 w-4' />
									</Button>
								</div>

								<div className='flex items-center justify-between rounded-lg border p-4'>
									<div className='flex items-center gap-3'>
										<IconId className='h-5 w-5 text-muted-foreground' />
										<div>
											<p className='text-sm font-medium'>License Number</p>
											<p className='text-sm text-muted-foreground'>{driver.license_number}</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										onClick={() => copyToClipboard(driver.license_number, 'License number')}
									>
										<IconCopy className='h-4 w-4' />
									</Button>
								</div>
							</div>
						</div>

						<Separator />

						{/* Contact Information */}
						{driver.user && (
							<>
								<div className='space-y-4'>
									<h4 className='text-sm font-medium text-muted-foreground'>Contact Information</h4>
									<div className='grid gap-4 md:grid-cols-2'>
										<div className='flex items-center justify-between rounded-lg border p-4'>
											<div className='flex items-center gap-3'>
												<IconMail className='h-5 w-5 text-muted-foreground' />
												<div>
													<p className='text-sm font-medium'>Email</p>
													<p className='text-sm text-muted-foreground'>{driver.user.email}</p>
												</div>
											</div>
											<Button
												variant='ghost'
												size='icon'
												onClick={() => copyToClipboard(driver.user!.email, 'Email')}
											>
												<IconCopy className='h-4 w-4' />
											</Button>
										</div>

										<div className='flex items-center justify-between rounded-lg border p-4'>
											<div className='flex items-center gap-3'>
												<IconPhone className='h-5 w-5 text-muted-foreground' />
												<div>
													<p className='text-sm font-medium'>Phone</p>
													<p className='text-sm text-muted-foreground'>{driver.user.phone_number}</p>
												</div>
											</div>
											<Button
												variant='ghost'
												size='icon'
												onClick={() => copyToClipboard(driver.user!.phone_number, 'Phone')}
											>
												<IconCopy className='h-4 w-4' />
											</Button>
										</div>
									</div>
								</div>

								<Separator />
							</>
						)}

						{/* Account Information */}
						<div className='space-y-4'>
							<h4 className='text-sm font-medium text-muted-foreground'>Account Information</h4>
							<div className='grid gap-4 md:grid-cols-2'>
								<div className='flex items-center justify-between rounded-lg border p-4'>
									<div className='flex items-center gap-3'>
										<IconId className='h-5 w-5 text-muted-foreground' />
										<div>
											<p className='text-sm font-medium'>Driver ID</p>
											<p className='text-xs text-muted-foreground font-mono truncate max-w-[180px]'>
												{driver.id}
											</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										onClick={() => copyToClipboard(driver.id, 'Driver ID')}
									>
										<IconCopy className='h-4 w-4' />
									</Button>
								</div>

								<div className='flex items-center gap-3 rounded-lg border p-4'>
									<IconCalendar className='h-5 w-5 text-muted-foreground' />
									<div>
										<p className='text-sm font-medium'>Applied</p>
										<p className='text-sm text-muted-foreground'>{formatDate(driver.created_at)}</p>
									</div>
								</div>

								<div className='flex items-center gap-3 rounded-lg border p-4'>
									<IconCalendar className='h-5 w-5 text-muted-foreground' />
									<div>
										<p className='text-sm font-medium'>Last Updated</p>
										<p className='text-sm text-muted-foreground'>{formatDate(driver.updated_at)}</p>
									</div>
								</div>

								{driver.last_location_update && (
									<div className='flex items-center gap-3 rounded-lg border p-4'>
										<IconMapPin className='h-5 w-5 text-muted-foreground' />
										<div>
											<p className='text-sm font-medium'>Last Location Update</p>
											<p className='text-sm text-muted-foreground'>
												{formatDate(driver.last_location_update)}
											</p>
										</div>
									</div>
								)}
							</div>
						</div>

						<Separator />

						{/* Status */}
						<div className='space-y-4'>
							<h4 className='text-sm font-medium text-muted-foreground'>Account Status</h4>
							<div className='grid gap-4 md:grid-cols-3'>
								<div className='rounded-lg border p-4'>
									<p className='text-sm text-muted-foreground'>Approval Status</p>
									<p className='text-lg font-semibold'>
										{driver.is_available ? (
											<span className='text-green-600'>Approved</span>
										) : (
											<span className='text-orange-600'>Pending</span>
										)}
									</p>
								</div>
								<div className='rounded-lg border p-4'>
									<p className='text-sm text-muted-foreground'>Online Status</p>
									<p className='text-lg font-semibold flex items-center gap-2'>
										{driver.is_online ? (
											<>
												<IconCloudCheck className='h-5 w-5 text-green-600' />
												<span className='text-green-600'>Online</span>
											</>
										) : (
											<>
												<IconCloudOff className='h-5 w-5 text-muted-foreground' />
												<span className='text-muted-foreground'>Offline</span>
											</>
										)}
									</p>
								</div>
								<div className='rounded-lg border p-4'>
									<p className='text-sm text-muted-foreground'>User Account</p>
									<p className='text-lg font-semibold'>
										{driver.user?.is_active ? (
											<span className='text-green-600'>Active</span>
										) : (
											<span className='text-red-600'>Suspended</span>
										)}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Approve Confirmation Dialog */}
			<AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<IconUserCheck className='h-5 w-5 text-green-600' />
							Approve Driver
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to approve{' '}
							<span className='font-medium'>
								{driver.user?.first_name} {driver.user?.last_name}
							</span>
							? This will allow them to start accepting rides.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className='space-y-2 py-4'>
						<Label htmlFor='approve-notes'>Notes (optional)</Label>
						<Textarea
							id='approve-notes'
							placeholder='Add any notes about this approval...'
							value={approveNotes}
							onChange={(e) => setApproveNotes(e.target.value)}
							rows={3}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isApproving}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmApprove}
							disabled={isApproving}
							className='bg-green-600 text-white hover:bg-green-700'
						>
							{isApproving ? 'Approving...' : 'Approve Driver'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Reject Confirmation Dialog */}
			<AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<IconUserX className='h-5 w-5 text-destructive' />
							Reject Driver Application
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to reject{' '}
							<span className='font-medium'>
								{driver.user?.first_name} {driver.user?.last_name}
							</span>
							? This will be communicated to the applicant.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className='space-y-2 py-4'>
						<Label htmlFor='reject-reason'>Reason for rejection</Label>
						<Textarea
							id='reject-reason'
							placeholder='Enter the reason for rejecting this application...'
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							rows={3}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isRejecting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmReject}
							disabled={isRejecting || !rejectReason.trim()}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							{isRejecting ? 'Rejecting...' : 'Reject Application'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
