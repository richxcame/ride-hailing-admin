'use client';

import {
	IconMapPin,
	IconCopy,
	IconCar,
	IconUser,
	IconClock,
	IconCurrencyDollar,
	IconStar,
	IconRoute,
	IconCalendar,
	IconId,
	IconX,
	IconCheck,
	IconPlayerPlay,
	IconFlag,
	IconExternalLink,
} from '@tabler/icons-react';
import { Ride } from '@/lib/types/models';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetFooter,
} from '@/components/ui/sheet';
import { toast } from 'sonner';

interface RideDetailSheetProps {
	ride: Ride | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCancelRide?: (rideId: string) => void;
}

export function RideDetailSheet({
	ride,
	open,
	onOpenChange,
	onCancelRide,
}: RideDetailSheetProps) {
	if (!ride) return null;

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const formatTime = (dateString: string) => {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
		});
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

	const handleOpenFullPage = () => {
		window.location.href = `/dashboard/rides/${ride.id}`;
	};

	const canCancel = ride.status === 'requested' || ride.status === 'accepted';

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='flex flex-col'>
				<SheetHeader>
					<SheetTitle>Ride Details</SheetTitle>
					<SheetDescription>View ride information and timeline</SheetDescription>
				</SheetHeader>

				<div className='flex-1 overflow-y-auto'>
					<div className='space-y-6 px-4 pb-6'>
						{/* Ride Status & ID */}
						<div className='flex items-center justify-between'>
							{getStatusBadge(ride.status)}
							<div className='flex items-center gap-2'>
								<span className='text-xs font-mono text-muted-foreground'>
									{ride.id.substring(0, 8)}...
								</span>
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

						<Separator />

						{/* Route Information */}
						<div className='space-y-3'>
							<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
								Route
							</h4>

							<div className='space-y-2'>
								<div className='flex items-start gap-3 rounded-md border px-3 py-2.5'>
									<IconMapPin className='h-4 w-4 text-green-600 shrink-0 mt-0.5' />
									<div className='min-w-0'>
										<p className='text-xs text-muted-foreground'>Pickup</p>
										<p className='text-sm font-medium'>{ride.pickup_address}</p>
									</div>
								</div>

								<div className='flex items-start gap-3 rounded-md border px-3 py-2.5'>
									<IconMapPin className='h-4 w-4 text-red-600 shrink-0 mt-0.5' />
									<div className='min-w-0'>
										<p className='text-xs text-muted-foreground'>Dropoff</p>
										<p className='text-sm font-medium'>{ride.dropoff_address}</p>
									</div>
								</div>

								{(ride.actual_distance || ride.estimated_distance) && (
									<div className='grid grid-cols-2 gap-2'>
										<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
											<IconRoute className='h-4 w-4 text-muted-foreground shrink-0' />
											<div className='min-w-0'>
												<p className='text-xs text-muted-foreground'>Distance</p>
												<p className='text-sm font-medium'>
													{formatDistance(ride.actual_distance || ride.estimated_distance || 0)}
												</p>
											</div>
										</div>

										<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
											<IconClock className='h-4 w-4 text-muted-foreground shrink-0' />
											<div className='min-w-0'>
												<p className='text-xs text-muted-foreground'>Duration</p>
												<p className='text-sm font-medium'>
													{formatDuration(ride.actual_duration || ride.estimated_duration || 0)}
												</p>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>

						<Separator />

						{/* Rider Information */}
						{ride.rider && (
							<>
								<div className='space-y-3'>
									<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
										Rider
									</h4>

									<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
										<Avatar className='h-10 w-10'>
											<AvatarImage src={ride.rider.profile_image} alt={ride.rider.first_name} />
											<AvatarFallback className='bg-primary/10'>
												{ride.rider.first_name?.charAt(0)}
												{ride.rider.last_name?.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<div className='min-w-0 flex-1'>
											<p className='text-sm font-medium truncate'>
												{ride.rider.first_name} {ride.rider.last_name}
											</p>
											<p className='text-xs text-muted-foreground truncate'>
												{ride.rider.phone_number}
											</p>
										</div>
										<Button
											variant='ghost'
											size='icon'
											className='h-8 w-8 shrink-0'
											onClick={() => copyToClipboard(ride.rider!.phone_number, 'Phone')}
										>
											<IconCopy className='h-4 w-4' />
										</Button>
									</div>
								</div>

								<Separator />
							</>
						)}

						{/* Driver Information */}
						{ride.driver ? (
							<>
								<div className='space-y-3'>
									<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
										Driver
									</h4>

									<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
										<Avatar className='h-10 w-10'>
											<AvatarImage src={ride.driver.profile_image} alt={ride.driver.first_name} />
											<AvatarFallback className='bg-primary/10'>
												{ride.driver.first_name?.charAt(0)}
												{ride.driver.last_name?.charAt(0)}
											</AvatarFallback>
										</Avatar>
										<div className='min-w-0 flex-1'>
											<p className='text-sm font-medium truncate'>
												{ride.driver.first_name} {ride.driver.last_name}
											</p>
											<p className='text-xs text-muted-foreground truncate'>
												{ride.driver.phone_number}
											</p>
											{ride.driver.rating && (
												<div className='flex items-center gap-1 mt-0.5'>
													<IconStar className='h-3 w-3 fill-yellow-400 text-yellow-400' />
													<span className='text-xs font-medium'>{ride.driver.rating.toFixed(1)}</span>
												</div>
											)}
										</div>
										<Button
											variant='ghost'
											size='icon'
											className='h-8 w-8 shrink-0'
											onClick={() => copyToClipboard(ride.driver!.phone_number, 'Phone')}
										>
											<IconCopy className='h-4 w-4' />
										</Button>
									</div>

									{/* Vehicle Info */}
									<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
										<IconCar className='h-4 w-4 text-muted-foreground shrink-0' />
										<div className='min-w-0'>
											<p className='text-xs text-muted-foreground'>Vehicle</p>
											<p className='text-sm font-medium truncate'>
												{ride.driver.vehicle_color} {ride.driver.vehicle_model} • {ride.driver.vehicle_plate}
											</p>
										</div>
									</div>
								</div>

								<Separator />
							</>
						) : (
							ride.status !== 'cancelled' && (
								<>
									<div className='space-y-3'>
										<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
											Driver
										</h4>
										<div className='flex items-center gap-3 rounded-md border border-dashed px-3 py-4'>
											<IconCar className='h-5 w-5 text-muted-foreground' />
											<p className='text-sm text-muted-foreground'>No driver assigned yet</p>
										</div>
									</div>
									<Separator />
								</>
							)
						)}

						{/* Fare Information */}
						<div className='space-y-3'>
							<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
								Fare
							</h4>

							<div className='space-y-2'>
								<div className='flex items-center justify-between rounded-md border px-3 py-2.5'>
									<div className='flex items-center gap-3'>
										<IconCurrencyDollar className='h-4 w-4 text-green-600 shrink-0' />
										<div>
											<p className='text-xs text-muted-foreground'>
												{ride.final_fare ? 'Final Fare' : 'Estimated Fare'}
											</p>
											<p className='text-lg font-semibold'>
												{formatCurrency(ride.final_fare || ride.estimated_fare || 0)}
											</p>
										</div>
									</div>
									{ride.surge_multiplier && ride.surge_multiplier > 1 && (
										<Badge variant='outline' className='border-orange-500 text-orange-600'>
											{ride.surge_multiplier}x Surge
										</Badge>
									)}
								</div>

								{ride.discount_amount && ride.discount_amount > 0 && (
									<div className='flex items-center justify-between rounded-md border px-3 py-2.5 bg-green-50'>
										<span className='text-sm text-green-700'>Discount Applied</span>
										<span className='text-sm font-medium text-green-700'>
											-{formatCurrency(ride.discount_amount)}
										</span>
									</div>
								)}
							</div>
						</div>

						<Separator />

						{/* Rating & Feedback */}
						{ride.status === 'completed' && (
							<>
								<div className='space-y-3'>
									<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
										Rating & Feedback
									</h4>

									<div className='space-y-2'>
										<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
											<IconStar className='h-4 w-4 text-yellow-500 shrink-0' />
											<div className='min-w-0'>
												<p className='text-xs text-muted-foreground'>Rating</p>
												<p className='text-sm font-medium'>
													{ride.rating ? `${ride.rating.toFixed(1)} / 5` : 'Not rated'}
												</p>
											</div>
										</div>

										{ride.feedback && (
											<div className='rounded-md border px-3 py-2.5'>
												<p className='text-xs text-muted-foreground mb-1'>Feedback</p>
												<p className='text-sm'>{ride.feedback}</p>
											</div>
										)}
									</div>
								</div>

								<Separator />
							</>
						)}

						{/* Cancellation Info */}
						{ride.status === 'cancelled' && ride.cancellation_reason && (
							<>
								<div className='space-y-3'>
									<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
										Cancellation
									</h4>

									<div className='rounded-md border border-red-200 bg-red-50 px-3 py-2.5'>
										<p className='text-xs text-red-600 mb-1'>Reason</p>
										<p className='text-sm text-red-700'>{ride.cancellation_reason}</p>
									</div>
								</div>

								<Separator />
							</>
						)}

						{/* Timeline */}
						<div className='space-y-3'>
							<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
								Timeline
							</h4>

							<div className='space-y-2'>
								<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
									<IconCalendar className='h-4 w-4 text-muted-foreground shrink-0' />
									<div className='min-w-0'>
										<p className='text-xs text-muted-foreground'>Requested</p>
										<p className='text-sm font-medium'>{formatDateTime(ride.requested_at)}</p>
									</div>
								</div>

								{ride.accepted_at && (
									<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
										<IconCheck className='h-4 w-4 text-purple-600 shrink-0' />
										<div className='min-w-0'>
											<p className='text-xs text-muted-foreground'>Accepted</p>
											<p className='text-sm font-medium'>{formatDateTime(ride.accepted_at)}</p>
										</div>
									</div>
								)}

								{ride.started_at && (
									<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
										<IconPlayerPlay className='h-4 w-4 text-yellow-600 shrink-0' />
										<div className='min-w-0'>
											<p className='text-xs text-muted-foreground'>Started</p>
											<p className='text-sm font-medium'>{formatDateTime(ride.started_at)}</p>
										</div>
									</div>
								)}

								{ride.completed_at && (
									<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
										<IconFlag className='h-4 w-4 text-green-600 shrink-0' />
										<div className='min-w-0'>
											<p className='text-xs text-muted-foreground'>Completed</p>
											<p className='text-sm font-medium'>{formatDateTime(ride.completed_at)}</p>
										</div>
									</div>
								)}

								{ride.cancelled_at && (
									<div className='flex items-center gap-3 rounded-md border border-red-200 px-3 py-2.5'>
										<IconX className='h-4 w-4 text-red-600 shrink-0' />
										<div className='min-w-0'>
											<p className='text-xs text-muted-foreground'>Cancelled</p>
											<p className='text-sm font-medium'>{formatDateTime(ride.cancelled_at)}</p>
										</div>
									</div>
								)}
							</div>
						</div>

						<Separator />

						{/* Additional Info */}
						<div className='space-y-3'>
							<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
								Additional Info
							</h4>

							<div className='space-y-2'>
								<div className='flex items-center justify-between rounded-md border px-3 py-2.5'>
									<div className='flex items-center gap-3 min-w-0 flex-1'>
										<IconId className='h-4 w-4 text-muted-foreground shrink-0' />
										<div className='min-w-0 flex-1'>
											<p className='text-xs text-muted-foreground'>Ride ID</p>
											<p className='text-xs font-mono truncate'>{ride.id}</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										className='h-8 w-8 shrink-0'
										onClick={() => copyToClipboard(ride.id, 'Ride ID')}
									>
										<IconCopy className='h-4 w-4' />
									</Button>
								</div>

								{ride.ride_type && (
									<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
										<IconCar className='h-4 w-4 text-muted-foreground shrink-0' />
										<div className='min-w-0'>
											<p className='text-xs text-muted-foreground'>Ride Type</p>
											<p className='text-sm font-medium'>{ride.ride_type.name}</p>
										</div>
									</div>
								)}

								{ride.is_scheduled && ride.scheduled_at && (
									<div className='flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5'>
										<IconClock className='h-4 w-4 text-blue-600 shrink-0' />
										<div className='min-w-0'>
											<p className='text-xs text-blue-600'>Scheduled Ride</p>
											<p className='text-sm font-medium text-blue-700'>
												{formatDateTime(ride.scheduled_at)}
											</p>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				<SheetFooter>
					<div className='flex gap-2 w-full'>
						{canCancel && onCancelRide && (
							<Button
								variant='destructive'
								className='flex-1'
								onClick={() => onCancelRide(ride.id)}
							>
								<IconX className='h-4 w-4 mr-2' />
								Cancel Ride
							</Button>
						)}
						<Button
							variant='outline'
							className={canCancel && onCancelRide ? 'flex-1' : 'w-full'}
							onClick={handleOpenFullPage}
						>
							<IconExternalLink className='h-4 w-4 mr-2' />
							Open Full Page
						</Button>
					</div>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
