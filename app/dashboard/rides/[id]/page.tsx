'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
	IconArrowLeft,
	IconMapPin,
	IconCopy,
	IconCar,
	IconUser,
	IconClock,
	IconCurrencyDollar,
	IconStar,
	IconRoute,
	IconId,
	IconX,
	IconCheck,
	IconPlayerPlay,
	IconFlag,
	IconPhone,
	IconMail,
	IconRefresh,
} from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import { Ride } from '@/lib/types/models';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function RideDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const resolvedParams = use(params);
	const router = useRouter();
	const [ride, setRide] = useState<Ride | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [refreshTick, setRefreshTick] = useState(0);

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const data = await adminService.getRide(resolvedParams.id);
				if (active) setRide(data);
			} catch (error) {
				if (!active) return;
				const errorMessage = error instanceof Error ? error.message : 'Failed to load ride';
				toast.error('Failed to load ride', { description: errorMessage });
			} finally {
				if (active) setIsLoading(false);
			}
		})();
		return () => {
			active = false;
		};
	}, [resolvedParams.id, refreshTick]);

	const fetchRide = () => {
		setIsLoading(true);
		setRefreshTick((t) => t + 1);
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
		}).format(value);
	};

	const formatDuration = (minutes: number) => {
		if (minutes < 60) return `${minutes} min`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	};

	const formatDistance = (km: number) => {
		return `${km.toFixed(1)} km`;
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied to clipboard`);
	};

	const getStatusBadge = (status: string) => {
		const statusConfig: Record<
			string,
			{ label: string; className: string; icon: React.ReactNode }
		> = {
			requested: {
				label: 'Requested',
				className: 'border-blue-500 text-blue-600 bg-blue-50',
				icon: <IconClock className='h-3 w-3' />,
			},
			accepted: {
				label: 'Accepted',
				className: 'border-purple-500 text-purple-600 bg-purple-50',
				icon: <IconCheck className='h-3 w-3' />,
			},
			in_progress: {
				label: 'In Progress',
				className: 'border-yellow-500 text-yellow-600 bg-yellow-50',
				icon: <IconPlayerPlay className='h-3 w-3' />,
			},
			completed: {
				label: 'Completed',
				className: 'border-green-500 text-green-600 bg-green-50',
				icon: <IconFlag className='h-3 w-3' />,
			},
			cancelled: {
				label: 'Cancelled',
				className: 'border-red-500 text-red-600 bg-red-50',
				icon: <IconX className='h-3 w-3' />,
			},
		};

		const config = statusConfig[status] || {
			label: status,
			className: 'border-gray-500 text-gray-600',
			icon: null,
		};

		return (
			<Badge variant='outline' className={`gap-1 ${config.className}`}>
				{config.icon}
				{config.label}
			</Badge>
		);
	};

	const handleCancelRide = async () => {
		if (!ride) return;
		try {
			// In a real app, you'd call an API to cancel the ride
			toast.success('Ride cancelled successfully');
			setShowCancelDialog(false);
			fetchRide();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to cancel ride';
			toast.error('Failed to cancel ride', { description: errorMessage });
		}
	};

	if (isLoading) {
		return (
			<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
				<div className='flex items-center gap-4'>
					<Skeleton className='h-10 w-10' />
					<div className='space-y-2'>
						<Skeleton className='h-6 w-48' />
						<Skeleton className='h-4 w-32' />
					</div>
				</div>
				<div className='grid gap-4 md:grid-cols-2'>
					<Skeleton className='h-64' />
					<Skeleton className='h-64' />
				</div>
			</div>
		);
	}

	if (!ride) {
		return (
			<div className='flex flex-1 flex-col items-center justify-center gap-4 p-4'>
				<p className='text-muted-foreground'>Ride not found</p>
				<Button variant='outline' onClick={() => router.push('/dashboard/rides')}>
					<IconArrowLeft className='h-4 w-4 mr-2' />
					Back to Rides
				</Button>
			</div>
		);
	}

	const canCancel = ride.status === 'requested' || ride.status === 'accepted';

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-4'>
					<Button variant='outline' size='icon' onClick={() => router.push('/dashboard/rides')}>
						<IconArrowLeft className='h-4 w-4' />
					</Button>
					<div>
						<div className='flex items-center gap-2'>
							<h1 className='text-2xl font-semibold tracking-tight'>Ride Details</h1>
							{getStatusBadge(ride.status)}
						</div>
						<p className='text-sm text-muted-foreground font-mono'>
							{ride.id}
						</p>
					</div>
				</div>
				<div className='flex gap-2'>
					<Button variant='outline' size='sm' onClick={fetchRide}>
						<IconRefresh className='h-4 w-4 mr-2' />
						Refresh
					</Button>
					{canCancel && (
						<Button
							variant='destructive'
							size='sm'
							onClick={() => setShowCancelDialog(true)}
						>
							<IconX className='h-4 w-4 mr-2' />
							Cancel Ride
						</Button>
					)}
				</div>
			</div>

			<div className='grid gap-4 lg:grid-cols-3'>
				{/* Main Info - Left Column */}
				<div className='lg:col-span-2 space-y-4'>
					{/* Route Card */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg flex items-center gap-2'>
								<IconRoute className='h-5 w-5' />
								Route Information
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='grid gap-4 md:grid-cols-2'>
								<div className='flex items-start gap-3 rounded-lg border p-4'>
									<IconMapPin className='h-5 w-5 text-green-600 shrink-0 mt-0.5' />
									<div className='min-w-0'>
										<p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
											Pickup Location
										</p>
										<p className='text-sm font-medium mt-1'>{ride.pickup_address}</p>
										<p className='text-xs text-muted-foreground mt-1'>
											{ride.pickup_latitude.toFixed(6)}, {ride.pickup_longitude.toFixed(6)}
										</p>
									</div>
								</div>

								<div className='flex items-start gap-3 rounded-lg border p-4'>
									<IconMapPin className='h-5 w-5 text-red-600 shrink-0 mt-0.5' />
									<div className='min-w-0'>
										<p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
											Dropoff Location
										</p>
										<p className='text-sm font-medium mt-1'>{ride.dropoff_address}</p>
										<p className='text-xs text-muted-foreground mt-1'>
											{ride.dropoff_latitude.toFixed(6)}, {ride.dropoff_longitude.toFixed(6)}
										</p>
									</div>
								</div>
							</div>

							<Separator />

							<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
								<div className='text-center p-3 rounded-lg bg-muted/50'>
									<p className='text-xs text-muted-foreground'>Distance</p>
									<p className='text-lg font-semibold'>
										{formatDistance(ride.actual_distance || ride.estimated_distance || 0)}
									</p>
								</div>
								<div className='text-center p-3 rounded-lg bg-muted/50'>
									<p className='text-xs text-muted-foreground'>Duration</p>
									<p className='text-lg font-semibold'>
										{formatDuration(ride.actual_duration || ride.estimated_duration || 0)}
									</p>
								</div>
								<div className='text-center p-3 rounded-lg bg-muted/50'>
									<p className='text-xs text-muted-foreground'>Fare</p>
									<p className='text-lg font-semibold text-green-600'>
										{formatCurrency(ride.final_fare || ride.estimated_fare || 0)}
									</p>
								</div>
								{ride.surge_multiplier && ride.surge_multiplier > 1 && (
									<div className='text-center p-3 rounded-lg bg-orange-50'>
										<p className='text-xs text-orange-600'>Surge</p>
										<p className='text-lg font-semibold text-orange-600'>
											{ride.surge_multiplier}x
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Rider & Driver Cards */}
					<div className='grid gap-4 md:grid-cols-2'>
						{/* Rider Card */}
						{ride.rider && (
							<Card>
								<CardHeader>
									<CardTitle className='text-lg flex items-center gap-2'>
										<IconUser className='h-5 w-5' />
										Rider
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='flex items-center gap-4'>
										<Avatar className='h-16 w-16'>
											<AvatarImage src={ride.rider.profile_image} alt={ride.rider.first_name} />
											<AvatarFallback className='text-lg bg-primary/10'>
												{ride.rider.first_name?.charAt(0)}
												{ride.rider.last_name?.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<div className='flex-1 min-w-0'>
											<h3 className='font-semibold truncate'>
												{ride.rider.first_name} {ride.rider.last_name}
											</h3>
											<div className='flex items-center gap-2 text-sm text-muted-foreground mt-1'>
												<IconMail className='h-4 w-4' />
												<span className='truncate'>{ride.rider.email}</span>
											</div>
											<div className='flex items-center gap-2 text-sm text-muted-foreground mt-1'>
												<IconPhone className='h-4 w-4' />
												<span>{ride.rider.phone_number}</span>
											</div>
										</div>
									</div>
									<Separator className='my-4' />
									<div className='flex gap-2'>
										<Button
											variant='outline'
											size='sm'
											className='flex-1'
											onClick={() => copyToClipboard(ride.rider!.phone_number, 'Phone')}
										>
											<IconCopy className='h-4 w-4 mr-2' />
											Copy Phone
										</Button>
										<Button
											variant='outline'
											size='sm'
											className='flex-1'
											onClick={() => (window.location.href = `/dashboard/users/${ride.rider!.id}`)}
										>
											View Profile
										</Button>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Driver Card */}
						<Card>
							<CardHeader>
								<CardTitle className='text-lg flex items-center gap-2'>
									<IconCar className='h-5 w-5' />
									Driver
								</CardTitle>
							</CardHeader>
							<CardContent>
								{ride.driver ? (
									<>
										<div className='flex items-center gap-4'>
											<Avatar className='h-16 w-16'>
												<AvatarImage
													src={ride.driver.profile_image}
													alt={ride.driver.first_name}
												/>
												<AvatarFallback className='text-lg bg-primary/10'>
													{ride.driver.first_name?.charAt(0)}
													{ride.driver.last_name?.charAt(0)}
												</AvatarFallback>
											</Avatar>
											<div className='flex-1 min-w-0'>
												<h3 className='font-semibold truncate'>
													{ride.driver.first_name} {ride.driver.last_name}
												</h3>
												<div className='flex items-center gap-2 text-sm text-muted-foreground mt-1'>
													<IconPhone className='h-4 w-4' />
													<span>{ride.driver.phone_number}</span>
												</div>
												<div className='flex items-center gap-2 text-sm text-muted-foreground mt-1'>
													<IconCar className='h-4 w-4' />
													<span className='truncate'>
														{ride.driver.vehicle_color} {ride.driver.vehicle_model} • {ride.driver.vehicle_plate}
													</span>
												</div>
												{ride.driver.rating && (
													<div className='flex items-center gap-1 mt-1'>
														<IconStar className='h-4 w-4 fill-yellow-400 text-yellow-400' />
														<span className='text-sm font-medium'>{ride.driver.rating.toFixed(1)}</span>
													</div>
												)}
											</div>
										</div>
										<Separator className='my-4' />
										<div className='flex gap-2'>
											<Button
												variant='outline'
												size='sm'
												className='flex-1'
												onClick={() => copyToClipboard(ride.driver!.phone_number, 'Phone')}
											>
												<IconCopy className='h-4 w-4 mr-2' />
												Copy Phone
											</Button>
											<Button
												variant='outline'
												size='sm'
												className='flex-1'
												onClick={() =>
													(window.location.href = `/dashboard/drivers/${ride.driver!.id}`)
												}
											>
												View Profile
											</Button>
										</div>
									</>
								) : (
									<div className='flex flex-col items-center justify-center py-8 text-center'>
										<IconCar className='h-12 w-12 text-muted-foreground mb-2' />
										<p className='text-sm text-muted-foreground'>No driver assigned yet</p>
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Rating & Feedback */}
					{ride.status === 'completed' && (
						<Card>
							<CardHeader>
								<CardTitle className='text-lg flex items-center gap-2'>
									<IconStar className='h-5 w-5' />
									Rating & Feedback
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='grid gap-4 md:grid-cols-2'>
									<div className='flex items-center gap-4 p-4 rounded-lg border'>
										<div className='flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100'>
											<span className='text-2xl font-bold text-yellow-600'>
												{ride.rating?.toFixed(1) || '-'}
											</span>
										</div>
										<div>
											<p className='text-sm text-muted-foreground'>Rating</p>
											<div className='flex items-center gap-1 mt-1'>
												{[1, 2, 3, 4, 5].map((star) => (
													<IconStar
														key={star}
														className={`h-5 w-5 ${
															ride.rating && star <= ride.rating
																? 'text-yellow-400 fill-yellow-400'
																: 'text-gray-300'
														}`}
													/>
												))}
											</div>
										</div>
									</div>

									{ride.feedback && (
										<div className='p-4 rounded-lg border'>
											<p className='text-sm text-muted-foreground mb-2'>Feedback</p>
											<p className='text-sm'>{ride.feedback}</p>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Cancellation Info */}
					{ride.status === 'cancelled' && ride.cancellation_reason && (
						<Card className='border-red-200'>
							<CardHeader>
								<CardTitle className='text-lg flex items-center gap-2 text-red-600'>
									<IconX className='h-5 w-5' />
									Cancellation Details
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className='p-4 rounded-lg bg-red-50 border border-red-200'>
									<p className='text-sm text-red-600 mb-2'>Reason for cancellation</p>
									<p className='text-sm text-red-700'>{ride.cancellation_reason}</p>
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Right Column - Timeline & Details */}
				<div className='space-y-4'>
					{/* Timeline Card */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg flex items-center gap-2'>
								<IconClock className='h-5 w-5' />
								Timeline
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='relative space-y-4'>
								{/* Timeline connector line */}
								<div className='absolute left-[11px] top-2 bottom-2 w-0.5 bg-border' />

								<div className='relative flex gap-4'>
									<div className='h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center z-10'>
										<IconClock className='h-3 w-3 text-blue-600' />
									</div>
									<div className='flex-1 pb-4'>
										<p className='text-sm font-medium'>Requested</p>
										<p className='text-xs text-muted-foreground'>
											{formatDateTime(ride.requested_at)}
										</p>
									</div>
								</div>

								{ride.accepted_at && (
									<div className='relative flex gap-4'>
										<div className='h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center z-10'>
											<IconCheck className='h-3 w-3 text-purple-600' />
										</div>
										<div className='flex-1 pb-4'>
											<p className='text-sm font-medium'>Accepted</p>
											<p className='text-xs text-muted-foreground'>
												{formatDateTime(ride.accepted_at)}
											</p>
										</div>
									</div>
								)}

								{ride.started_at && (
									<div className='relative flex gap-4'>
										<div className='h-6 w-6 rounded-full bg-yellow-100 flex items-center justify-center z-10'>
											<IconPlayerPlay className='h-3 w-3 text-yellow-600' />
										</div>
										<div className='flex-1 pb-4'>
											<p className='text-sm font-medium'>Started</p>
											<p className='text-xs text-muted-foreground'>
												{formatDateTime(ride.started_at)}
											</p>
										</div>
									</div>
								)}

								{ride.completed_at && (
									<div className='relative flex gap-4'>
										<div className='h-6 w-6 rounded-full bg-green-100 flex items-center justify-center z-10'>
											<IconFlag className='h-3 w-3 text-green-600' />
										</div>
										<div className='flex-1'>
											<p className='text-sm font-medium'>Completed</p>
											<p className='text-xs text-muted-foreground'>
												{formatDateTime(ride.completed_at)}
											</p>
										</div>
									</div>
								)}

								{ride.cancelled_at && (
									<div className='relative flex gap-4'>
										<div className='h-6 w-6 rounded-full bg-red-100 flex items-center justify-center z-10'>
											<IconX className='h-3 w-3 text-red-600' />
										</div>
										<div className='flex-1'>
											<p className='text-sm font-medium text-red-600'>Cancelled</p>
											<p className='text-xs text-muted-foreground'>
												{formatDateTime(ride.cancelled_at)}
											</p>
										</div>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Fare Details Card */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg flex items-center gap-2'>
								<IconCurrencyDollar className='h-5 w-5' />
								Fare Details
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							{ride.estimated_fare && (
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Estimated Fare</span>
									<span className='text-sm'>{formatCurrency(ride.estimated_fare)}</span>
								</div>
							)}

							{ride.surge_multiplier && ride.surge_multiplier > 1 && (
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Surge Multiplier</span>
									<Badge variant='outline' className='border-orange-500 text-orange-600'>
										{ride.surge_multiplier}x
									</Badge>
								</div>
							)}

							{ride.discount_amount && ride.discount_amount > 0 && (
								<div className='flex justify-between items-center text-green-600'>
									<span className='text-sm'>Discount</span>
									<span className='text-sm'>-{formatCurrency(ride.discount_amount)}</span>
								</div>
							)}

							<Separator />

							<div className='flex justify-between items-center'>
								<span className='text-sm font-medium'>
									{ride.final_fare ? 'Final Fare' : 'Estimated Total'}
								</span>
								<span className='text-lg font-bold text-green-600'>
									{formatCurrency(ride.final_fare || ride.estimated_fare || 0)}
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Additional Info Card */}
					<Card>
						<CardHeader>
							<CardTitle className='text-lg flex items-center gap-2'>
								<IconId className='h-5 w-5' />
								Additional Info
							</CardTitle>
						</CardHeader>
						<CardContent className='space-y-3'>
							<div className='flex justify-between items-center'>
								<span className='text-sm text-muted-foreground'>Ride ID</span>
								<div className='flex items-center gap-2'>
									<span className='text-xs font-mono'>{ride.id.substring(0, 12)}...</span>
									<Button
										variant='ghost'
										size='icon'
										className='h-6 w-6'
										onClick={() => copyToClipboard(ride.id, 'Ride ID')}
									>
										<IconCopy className='h-3 w-3' />
									</Button>
								</div>
							</div>

							{ride.ride_type && (
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Ride Type</span>
									<span className='text-sm font-medium'>{ride.ride_type.name}</span>
								</div>
							)}

							{ride.is_scheduled && (
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Scheduled</span>
									<Badge variant='outline' className='border-blue-500 text-blue-600'>
										Yes
									</Badge>
								</div>
							)}

							{ride.scheduled_at && (
								<div className='flex justify-between items-center'>
									<span className='text-sm text-muted-foreground'>Scheduled For</span>
									<span className='text-sm'>{formatDateTime(ride.scheduled_at)}</span>
								</div>
							)}

							<Separator />

							<div className='flex justify-between items-center'>
								<span className='text-sm text-muted-foreground'>Created</span>
								<span className='text-sm'>{formatDateTime(ride.created_at)}</span>
							</div>

							<div className='flex justify-between items-center'>
								<span className='text-sm text-muted-foreground'>Updated</span>
								<span className='text-sm'>{formatDateTime(ride.updated_at)}</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Cancel Ride Dialog */}
			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancel Ride</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to cancel this ride? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>No, keep ride</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleCancelRide}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							Yes, cancel ride
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
