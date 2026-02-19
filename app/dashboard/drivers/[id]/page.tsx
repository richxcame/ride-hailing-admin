'use client';

import { useCallback, useEffect, useState } from 'react';
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
	IconShieldCheck,
	IconShieldX,
	IconShieldQuestion,
	IconLoader2,
} from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import { verificationService } from '@/lib/api/verification.service';
import { Driver } from '@/lib/types/models';
import { BackgroundCheck } from '@/lib/types/verification';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
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

	// Background check state
	const [bgCheck, setBgCheck] = useState<BackgroundCheck | null>(null);
	const [bgCheckLoading, setBgCheckLoading] = useState(false);
	const [initiateDialogOpen, setInitiateDialogOpen] = useState(false);
	const [initiateProvider, setInitiateProvider] = useState<
		'mock' | 'checkr' | 'sterling' | 'first_advantage'
	>('mock');
	const [isInitiating, setIsInitiating] = useState(false);
	const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
	const [reviewStatus, setReviewStatus] = useState<'passed' | 'failed'>(
		'passed',
	);
	const [reviewNotes, setReviewNotes] = useState('');
	const [isReviewing, setIsReviewing] = useState(false);

	const fetchBgCheck = useCallback(async (dId: string) => {
		try {
			setBgCheckLoading(true);
			const check =
				await verificationService.getDriverBackgroundCheck(dId);
			setBgCheck(check);
		} catch {
			// Silently fail — no background check yet is a valid state
		} finally {
			setBgCheckLoading(false);
		}
	}, []);

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
			fetchBgCheck(driverId);
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
			setDriver({ ...driver, approval_status: 'approved' });
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to approve driver';
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
				error instanceof Error
					? error.message
					: 'Failed to reject driver';
			toast.error('Failed to reject driver', {
				description: errorMessage,
			});
		} finally {
			setIsRejecting(false);
		}
	};

	const handleInitiateCheck = async () => {
		if (!driver) return;
		try {
			setIsInitiating(true);
			const check = await verificationService.initiateCheck({
				driver_id: driver.id,
				provider: initiateProvider,
			});
			setBgCheck(check);
			setInitiateDialogOpen(false);
			toast.success('Background check initiated');
			if (initiateProvider === 'mock') {
				toast.info('Mock provider: check will auto-pass in ~5 seconds');
				setTimeout(() => fetchBgCheck(driver.id), 6000);
			}
		} catch (error) {
			toast.error('Failed to initiate background check', {
				description: error instanceof Error ? error.message : undefined,
			});
		} finally {
			setIsInitiating(false);
		}
	};

	const handleReviewCheck = async () => {
		if (!bgCheck) return;
		try {
			setIsReviewing(true);
			await verificationService.reviewCheck(bgCheck.id, {
				status: reviewStatus,
				notes: reviewNotes || undefined,
			});
			toast.success(`Background check marked as ${reviewStatus}`);
			setReviewDialogOpen(false);
			setReviewNotes('');
			await fetchBgCheck(driver!.id);
			// Refresh driver to reflect updated approval_status
			fetchDriver();
		} catch (error) {
			toast.error('Failed to review background check', {
				description: error instanceof Error ? error.message : undefined,
			});
		} finally {
			setIsReviewing(false);
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

	const isPending = driver.approval_status === 'pending';

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
						<CardDescription>
							Driver profile information
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						{/* Avatar & Name */}
						<div className='flex flex-col items-center text-center'>
							<Avatar className='h-24 w-24 mb-4'>
								<AvatarImage
									src={driver.user?.profile_image}
									alt={driver.user?.first_name}
								/>
								<AvatarFallback className='text-2xl'>
									{driver.user?.first_name?.charAt(0)}
									{driver.user?.last_name?.charAt(0)}
								</AvatarFallback>
							</Avatar>
							<h3 className='text-xl font-semibold'>
								{driver.user?.first_name}{' '}
								{driver.user?.last_name}
							</h3>
							<p className='text-sm text-muted-foreground'>
								{driver.user?.email}
							</p>
							<div className='flex items-center gap-2 mt-3'>
								{isPending ? (
									<Badge
										variant='outline'
										className='border-orange-500 text-orange-600'
									>
										Pending Approval
									</Badge>
								) : (
									<>
										<Badge variant='default'>
											Approved
										</Badge>
										<Badge
											variant={
												driver.is_online
													? 'default'
													: 'secondary'
											}
											className={
												driver.is_online
													? 'bg-green-600'
													: ''
											}
										>
											{driver.is_online
												? 'Online'
												: 'Offline'}
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
												{driver.rating?.toFixed(1) ||
													'N/A'}
											</span>
										</div>
										<p className='text-xs text-muted-foreground'>
											Rating
										</p>
									</div>
									<div>
										<div className='flex items-center justify-center gap-1'>
											<IconRoute className='h-5 w-5 text-blue-500' />
											<span className='text-2xl font-bold'>
												{driver.total_rides || 0}
											</span>
										</div>
										<p className='text-xs text-muted-foreground'>
											Total Rides
										</p>
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
										onClick={() =>
											setRejectDialogOpen(true)
										}
									>
										<IconUserX className='h-4 w-4 mr-2' />
										Reject
									</Button>
									<Button
										className='flex-1 bg-green-600 hover:bg-green-700'
										onClick={() =>
											setApproveDialogOpen(true)
										}
									>
										<IconUserCheck className='h-4 w-4 mr-2' />
										Approve
									</Button>
								</div>
							) : (
								<Button
									variant='outline'
									className='w-full'
									asChild
								>
									<Link
										href={`/dashboard/drivers/${driver.id}/rides`}
									>
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
						<CardDescription>
							Complete driver information
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-6'>
						{/* Vehicle Information */}
						<div className='space-y-4'>
							<h4 className='text-sm font-medium text-muted-foreground'>
								Vehicle Information
							</h4>
							<div className='grid gap-4 md:grid-cols-2'>
								<div className='flex items-center gap-3 rounded-lg border p-4'>
									<IconCar className='h-5 w-5 text-muted-foreground' />
									<div>
										<p className='text-sm font-medium'>
											Vehicle
										</p>
										<p className='text-sm text-muted-foreground'>
											{driver.vehicle_year}{' '}
											{driver.vehicle_model}
										</p>
									</div>
								</div>

								<div className='flex items-center gap-3 rounded-lg border p-4'>
									<div
										className='h-5 w-5 rounded-full border'
										style={{
											backgroundColor:
												driver.vehicle_color,
										}}
									/>
									<div>
										<p className='text-sm font-medium'>
											Color
										</p>
										<p className='text-sm text-muted-foreground capitalize'>
											{driver.vehicle_color}
										</p>
									</div>
								</div>

								<div className='flex items-center justify-between rounded-lg border p-4'>
									<div className='flex items-center gap-3'>
										<IconLicense className='h-5 w-5 text-muted-foreground' />
										<div>
											<p className='text-sm font-medium'>
												License Plate
											</p>
											<p className='text-sm text-muted-foreground'>
												{driver.vehicle_plate}
											</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										onClick={() =>
											copyToClipboard(
												driver.vehicle_plate,
												'License plate',
											)
										}
									>
										<IconCopy className='h-4 w-4' />
									</Button>
								</div>

								<div className='flex items-center justify-between rounded-lg border p-4'>
									<div className='flex items-center gap-3'>
										<IconId className='h-5 w-5 text-muted-foreground' />
										<div>
											<p className='text-sm font-medium'>
												License Number
											</p>
											<p className='text-sm text-muted-foreground'>
												{driver.license_number}
											</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										onClick={() =>
											copyToClipboard(
												driver.license_number,
												'License number',
											)
										}
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
									<h4 className='text-sm font-medium text-muted-foreground'>
										Contact Information
									</h4>
									<div className='grid gap-4 md:grid-cols-2'>
										<div className='flex items-center justify-between rounded-lg border p-4'>
											<div className='flex items-center gap-3'>
												<IconMail className='h-5 w-5 text-muted-foreground' />
												<div>
													<p className='text-sm font-medium'>
														Email
													</p>
													<p className='text-sm text-muted-foreground'>
														{driver.user.email}
													</p>
												</div>
											</div>
											<Button
												variant='ghost'
												size='icon'
												onClick={() =>
													copyToClipboard(
														driver.user!.email,
														'Email',
													)
												}
											>
												<IconCopy className='h-4 w-4' />
											</Button>
										</div>

										<div className='flex items-center justify-between rounded-lg border p-4'>
											<div className='flex items-center gap-3'>
												<IconPhone className='h-5 w-5 text-muted-foreground' />
												<div>
													<p className='text-sm font-medium'>
														Phone
													</p>
													<p className='text-sm text-muted-foreground'>
														{
															driver.user
																.phone_number
														}
													</p>
												</div>
											</div>
											<Button
												variant='ghost'
												size='icon'
												onClick={() =>
													copyToClipboard(
														driver.user!
															.phone_number,
														'Phone',
													)
												}
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
							<h4 className='text-sm font-medium text-muted-foreground'>
								Account Information
							</h4>
							<div className='grid gap-4 md:grid-cols-2'>
								<div className='flex items-center justify-between rounded-lg border p-4'>
									<div className='flex items-center gap-3'>
										<IconId className='h-5 w-5 text-muted-foreground' />
										<div>
											<p className='text-sm font-medium'>
												Driver ID
											</p>
											<p className='text-xs text-muted-foreground font-mono truncate max-w-45'>
												{driver.id}
											</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										onClick={() =>
											copyToClipboard(
												driver.id,
												'Driver ID',
											)
										}
									>
										<IconCopy className='h-4 w-4' />
									</Button>
								</div>

								<div className='flex items-center gap-3 rounded-lg border p-4'>
									<IconCalendar className='h-5 w-5 text-muted-foreground' />
									<div>
										<p className='text-sm font-medium'>
											Applied
										</p>
										<p className='text-sm text-muted-foreground'>
											{formatDate(driver.created_at)}
										</p>
									</div>
								</div>

								<div className='flex items-center gap-3 rounded-lg border p-4'>
									<IconCalendar className='h-5 w-5 text-muted-foreground' />
									<div>
										<p className='text-sm font-medium'>
											Last Updated
										</p>
										<p className='text-sm text-muted-foreground'>
											{formatDate(driver.updated_at)}
										</p>
									</div>
								</div>

								{driver.last_location_update && (
									<div className='flex items-center gap-3 rounded-lg border p-4'>
										<IconMapPin className='h-5 w-5 text-muted-foreground' />
										<div>
											<p className='text-sm font-medium'>
												Last Location Update
											</p>
											<p className='text-sm text-muted-foreground'>
												{formatDate(
													driver.last_location_update,
												)}
											</p>
										</div>
									</div>
								)}
							</div>
						</div>

						<Separator />

						{/* Status */}
						<div className='space-y-4'>
							<h4 className='text-sm font-medium text-muted-foreground'>
								Account Status
							</h4>
							<div className='grid gap-4 md:grid-cols-3'>
								<div className='rounded-lg border p-4'>
									<p className='text-sm text-muted-foreground'>
										Approval Status
									</p>
									<p className='text-lg font-semibold'>
										{driver.approval_status ===
										'approved' ? (
											<span className='text-green-600'>
												Approved
											</span>
										) : driver.approval_status ===
										  'rejected' ? (
											<span className='text-red-600'>
												Rejected
											</span>
										) : (
											<span className='text-orange-600'>
												Pending
											</span>
										)}
									</p>
								</div>
								<div className='rounded-lg border p-4'>
									<p className='text-sm text-muted-foreground'>
										Online Status
									</p>
									<p className='text-lg font-semibold flex items-center gap-2'>
										{driver.is_online ? (
											<>
												<IconCloudCheck className='h-5 w-5 text-green-600' />
												<span className='text-green-600'>
													Online
												</span>
											</>
										) : (
											<>
												<IconCloudOff className='h-5 w-5 text-muted-foreground' />
												<span className='text-muted-foreground'>
													Offline
												</span>
											</>
										)}
									</p>
								</div>
								<div className='rounded-lg border p-4'>
									<p className='text-sm text-muted-foreground'>
										User Account
									</p>
									<p className='text-lg font-semibold'>
										{driver.user?.is_active ? (
											<span className='text-green-600'>
												Active
											</span>
										) : (
											<span className='text-red-600'>
												Suspended
											</span>
										)}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Background Check Card */}
			<Card>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<div>
						<CardTitle className='text-base'>
							Background Check
						</CardTitle>
						<CardDescription>
							Criminal and driving record verification
						</CardDescription>
					</div>
					<div className='flex gap-2'>
						{bgCheck &&
							(bgCheck.status === 'pending' ||
								bgCheck.status === 'in_progress') && (
								<Button
									size='sm'
									variant='outline'
									onClick={() => setReviewDialogOpen(true)}
								>
									Review
								</Button>
							)}
						<Button
							size='sm'
							variant='outline'
							onClick={() => setInitiateDialogOpen(true)}
						>
							{bgCheck ? 'Re-initiate' : 'Initiate Check'}
						</Button>
					</div>
				</CardHeader>
				<CardContent className='pt-4'>
					{bgCheckLoading ? (
						<div className='flex items-center gap-3'>
							<Skeleton className='h-10 w-10 rounded-full' />
							<div className='space-y-1.5'>
								<Skeleton className='h-4 w-32' />
								<Skeleton className='h-3 w-48' />
							</div>
						</div>
					) : bgCheck ? (
						<div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
							<div className='flex items-center gap-3'>
								{bgCheck.status === 'passed' ? (
									<div className='rounded-full bg-green-100 p-2.5 dark:bg-green-900/40'>
										<IconShieldCheck className='h-5 w-5 text-green-600 dark:text-green-400' />
									</div>
								) : bgCheck.status === 'failed' ? (
									<div className='rounded-full bg-red-100 p-2.5 dark:bg-red-900/40'>
										<IconShieldX className='h-5 w-5 text-red-600 dark:text-red-400' />
									</div>
								) : (
									<div className='rounded-full bg-yellow-100 p-2.5 dark:bg-yellow-900/40'>
										<IconShieldQuestion className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
									</div>
								)}
								<div>
									<div className='flex items-center gap-2'>
										<p className='font-medium capitalize'>
											{bgCheck.status.replace('_', ' ')}
										</p>
										<Badge
											className={
												bgCheck.status === 'passed'
													? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
													: bgCheck.status ===
														  'failed'
														? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
														: bgCheck.status ===
															  'in_progress'
															? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
															: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
											}
										>
											{bgCheck.provider}
										</Badge>
									</div>
									{bgCheck.notes && (
										<p className='text-sm text-muted-foreground mt-0.5'>
											{bgCheck.notes}
										</p>
									)}
								</div>
							</div>
							<div className='grid grid-cols-2 gap-x-8 gap-y-1 text-sm'>
								<span className='text-muted-foreground'>
									Initiated
								</span>
								<span>
									{new Date(
										bgCheck.initiated_at,
									).toLocaleDateString('en-US', {
										month: 'short',
										day: 'numeric',
										year: 'numeric',
									})}
								</span>
								{bgCheck.completed_at && (
									<>
										<span className='text-muted-foreground'>
											Completed
										</span>
										<span>
											{new Date(
												bgCheck.completed_at,
											).toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
												year: 'numeric',
											})}
										</span>
									</>
								)}
								{bgCheck.expires_at && (
									<>
										<span className='text-muted-foreground'>
											Expires
										</span>
										<span>
											{new Date(
												bgCheck.expires_at,
											).toLocaleDateString('en-US', {
												month: 'short',
												day: 'numeric',
												year: 'numeric',
											})}
										</span>
									</>
								)}
							</div>
						</div>
					) : (
						<div className='flex items-center gap-3 text-muted-foreground'>
							<div className='rounded-full bg-muted p-2.5'>
								<IconShieldQuestion className='h-5 w-5' />
							</div>
							<p className='text-sm'>
								No background check on record. Initiate one to
								verify this driver.
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Initiate Background Check Dialog */}
			<Dialog
				open={initiateDialogOpen}
				onOpenChange={setInitiateDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Initiate Background Check</DialogTitle>
						<DialogDescription>
							Start a criminal and driving record check for{' '}
							<span className='font-medium'>
								{driver?.user?.first_name}{' '}
								{driver?.user?.last_name}
							</span>
							.
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-3 py-2'>
						<Label htmlFor='bg-provider'>Provider</Label>
						<Select
							value={initiateProvider}
							onValueChange={(v) =>
								setInitiateProvider(
									v as typeof initiateProvider,
								)
							}
						>
							<SelectTrigger id='bg-provider'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='mock'>
									Mock (auto-passes in ~5s, for testing)
								</SelectItem>
								<SelectItem value='checkr'>Checkr</SelectItem>
								<SelectItem value='sterling'>
									Sterling
								</SelectItem>
								<SelectItem value='first_advantage'>
									First Advantage
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setInitiateDialogOpen(false)}
							disabled={isInitiating}
						>
							Cancel
						</Button>
						<Button
							onClick={handleInitiateCheck}
							disabled={isInitiating}
						>
							{isInitiating && (
								<IconLoader2 className='h-4 w-4 mr-2 animate-spin' />
							)}
							{isInitiating ? 'Initiating...' : 'Initiate Check'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Review Background Check Dialog */}
			<Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Review Background Check</DialogTitle>
						<DialogDescription>
							Mark the result of the background check for{' '}
							<span className='font-medium'>
								{driver?.user?.first_name}{' '}
								{driver?.user?.last_name}
							</span>
							. Setting to <strong>passed</strong> will
							auto-approve the driver.
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 py-2'>
						<div className='space-y-2'>
							<Label>Result</Label>
							<div className='flex gap-3'>
								<button
									onClick={() => setReviewStatus('passed')}
									className={`flex-1 flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
										reviewStatus === 'passed'
											? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
											: 'hover:bg-muted'
									}`}
								>
									<IconShieldCheck className='h-4 w-4' />
									Passed
								</button>
								<button
									onClick={() => setReviewStatus('failed')}
									className={`flex-1 flex items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
										reviewStatus === 'failed'
											? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
											: 'hover:bg-muted'
									}`}
								>
									<IconShieldX className='h-4 w-4' />
									Failed
								</button>
							</div>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='review-notes'>
								Notes{' '}
								<span className='text-muted-foreground font-normal'>
									(optional)
								</span>
							</Label>
							<Textarea
								id='review-notes'
								placeholder={
									reviewStatus === 'passed'
										? 'e.g. All clear'
										: 'e.g. Criminal record found'
								}
								value={reviewNotes}
								onChange={(e) => setReviewNotes(e.target.value)}
								rows={3}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setReviewDialogOpen(false)}
							disabled={isReviewing}
						>
							Cancel
						</Button>
						<Button
							onClick={handleReviewCheck}
							disabled={isReviewing}
							className={
								reviewStatus === 'passed'
									? 'bg-green-600 hover:bg-green-700 text-white'
									: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
							}
						>
							{isReviewing && (
								<IconLoader2 className='h-4 w-4 mr-2 animate-spin' />
							)}
							{isReviewing
								? 'Saving...'
								: `Mark as ${reviewStatus}`}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Approve Confirmation Dialog */}
			<AlertDialog
				open={approveDialogOpen}
				onOpenChange={setApproveDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<IconUserCheck className='h-5 w-5 text-green-600' />
							Approve Driver
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to approve{' '}
							<span className='font-medium'>
								{driver.user?.first_name}{' '}
								{driver.user?.last_name}
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
						<AlertDialogCancel disabled={isApproving}>
							Cancel
						</AlertDialogCancel>
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
			<AlertDialog
				open={rejectDialogOpen}
				onOpenChange={setRejectDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<IconUserX className='h-5 w-5 text-destructive' />
							Reject Driver Application
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to reject{' '}
							<span className='font-medium'>
								{driver.user?.first_name}{' '}
								{driver.user?.last_name}
							</span>
							? This will be communicated to the applicant.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className='space-y-2 py-4'>
						<Label htmlFor='reject-reason'>
							Reason for rejection
						</Label>
						<Textarea
							id='reject-reason'
							placeholder='Enter the reason for rejecting this application...'
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							rows={3}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isRejecting}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmReject}
							disabled={isRejecting || !rejectReason.trim()}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							{isRejecting
								? 'Rejecting...'
								: 'Reject Application'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
