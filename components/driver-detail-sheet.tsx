'use client';

import {
	IconMail,
	IconPhone,
	IconCalendar,
	IconUserCheck,
	IconUserX,
	IconId,
	IconCopy,
	IconCar,
	IconLicense,
	IconStar,
	IconRoute,
	IconCloudCheck,
	IconCloudOff,
} from '@tabler/icons-react';
import { Driver } from '@/lib/types/models';
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

interface DriverDetailSheetProps {
	driver: Driver | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onApprove: () => void;
	onReject: () => void;
}

export function DriverDetailSheet({
	driver,
	open,
	onOpenChange,
	onApprove,
	onReject,
}: DriverDetailSheetProps) {
	if (!driver) return null;

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied to clipboard`);
	};

	const isPending = driver.approval_status === 'pending';

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='flex flex-col'>
				<SheetHeader>
					<SheetTitle>Driver Details</SheetTitle>
					<SheetDescription>View and manage driver information</SheetDescription>
				</SheetHeader>

				<div className='flex-1 overflow-y-auto'>
					<div className='space-y-6 px-4 pb-6'>
						{/* Driver Avatar & Basic Info */}
						<div className='flex items-start gap-4'>
							<Avatar className='h-14 w-14'>
								<AvatarImage src={driver.user?.profile_image} alt={driver.user?.first_name} />
								<AvatarFallback className='text-lg bg-primary/10'>
									{driver.user?.first_name?.charAt(0)}
									{driver.user?.last_name?.charAt(0)}
								</AvatarFallback>
							</Avatar>
							<div className='flex-1 min-w-0'>
								<h3 className='text-lg font-semibold truncate'>
									{driver.user?.first_name} {driver.user?.last_name}
								</h3>
								<p className='text-sm text-muted-foreground truncate'>
									{driver.user?.email}
								</p>
								<div className='flex flex-wrap items-center gap-1.5 mt-2'>
									{driver.approval_status === 'pending' ? (
										<Badge variant='outline' className='border-orange-500 text-orange-600'>
											Pending Approval
										</Badge>
									) : driver.approval_status === 'rejected' ? (
										<Badge variant='destructive'>
											Rejected
										</Badge>
									) : (
										<>
											<Badge
												variant='outline'
												className={
													driver.is_online
														? 'border-green-500 text-green-600'
														: 'border-gray-400 text-gray-500'
												}
											>
												{driver.is_online ? 'Online' : 'Offline'}
											</Badge>
											<Badge variant='default'>Approved</Badge>
										</>
									)}
								</div>
							</div>
						</div>

						<Separator />

						{/* Vehicle Information */}
						<div className='space-y-3'>
							<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
								Vehicle
							</h4>

							<div className='space-y-2'>
								<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
									<IconCar className='h-4 w-4 text-muted-foreground shrink-0' />
									<div className='min-w-0'>
										<p className='text-xs text-muted-foreground'>Model</p>
										<p className='text-sm font-medium truncate'>
											{driver.vehicle_year} {driver.vehicle_model}
										</p>
									</div>
								</div>

								<div className='grid grid-cols-2 gap-2'>
									<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
										<div className='min-w-0'>
											<p className='text-xs text-muted-foreground'>Plate</p>
											<p className='text-sm font-medium truncate'>
												{driver.vehicle_plate}
											</p>
										</div>
									</div>

									<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
										<div className='min-w-0'>
											<p className='text-xs text-muted-foreground'>Color</p>
											<p className='text-sm font-medium truncate capitalize'>
												{driver.vehicle_color}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						<Separator />

						{/* License Information */}
						<div className='space-y-3'>
							<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
								License
							</h4>

							<div className='flex items-center justify-between rounded-md border px-3 py-2.5'>
								<div className='flex items-center gap-3 min-w-0'>
									<IconLicense className='h-4 w-4 text-muted-foreground shrink-0' />
									<div className='min-w-0'>
										<p className='text-xs text-muted-foreground'>License Number</p>
										<p className='text-sm font-medium truncate'>
											{driver.license_number}
										</p>
									</div>
								</div>
								<Button
									variant='ghost'
									size='icon'
									className='h-8 w-8 shrink-0'
									onClick={() => copyToClipboard(driver.license_number, 'License number')}
								>
									<IconCopy className='h-4 w-4' />
								</Button>
							</div>
						</div>

						<Separator />

						{/* Performance Stats */}
						{!isPending && (
							<>
								<div className='space-y-3'>
									<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
										Performance
									</h4>

									<div className='grid grid-cols-2 gap-2'>
										<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
											<IconStar className='h-4 w-4 text-yellow-500 shrink-0' />
											<div className='min-w-0'>
												<p className='text-xs text-muted-foreground'>Rating</p>
												<p className='text-sm font-medium'>
													{driver.rating?.toFixed(1) || 'N/A'}
												</p>
											</div>
										</div>

										<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
											<IconRoute className='h-4 w-4 text-muted-foreground shrink-0' />
											<div className='min-w-0'>
												<p className='text-xs text-muted-foreground'>Total Rides</p>
												<p className='text-sm font-medium'>
													{driver.total_rides || 0}
												</p>
											</div>
										</div>
									</div>
								</div>

								<Separator />
							</>
						)}

						{/* Contact Information */}
						{driver.user && (
							<>
								<div className='space-y-3'>
									<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
										Contact
									</h4>

									<div className='space-y-2'>
										<div className='flex items-center justify-between rounded-md border px-3 py-2.5'>
											<div className='flex items-center gap-3 min-w-0'>
												<IconMail className='h-4 w-4 text-muted-foreground shrink-0' />
												<div className='min-w-0'>
													<p className='text-xs text-muted-foreground'>Email</p>
													<p className='text-sm font-medium truncate'>
														{driver.user.email}
													</p>
												</div>
											</div>
											<Button
												variant='ghost'
												size='icon'
												className='h-8 w-8 shrink-0'
												onClick={() => copyToClipboard(driver.user!.email, 'Email')}
											>
												<IconCopy className='h-4 w-4' />
											</Button>
										</div>

										<div className='flex items-center justify-between rounded-md border px-3 py-2.5'>
											<div className='flex items-center gap-3 min-w-0'>
												<IconPhone className='h-4 w-4 text-muted-foreground shrink-0' />
												<div className='min-w-0'>
													<p className='text-xs text-muted-foreground'>Phone</p>
													<p className='text-sm font-medium truncate'>
														{driver.user.phone_number}
													</p>
												</div>
											</div>
											<Button
												variant='ghost'
												size='icon'
												className='h-8 w-8 shrink-0'
												onClick={() =>
													copyToClipboard(driver.user!.phone_number, 'Phone')
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
						<div className='space-y-3'>
							<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
								Account
							</h4>

							<div className='space-y-2'>
								<div className='flex items-center justify-between rounded-md border px-3 py-2.5'>
									<div className='flex items-center gap-3 min-w-0 flex-1'>
										<IconId className='h-4 w-4 text-muted-foreground shrink-0' />
										<div className='min-w-0 flex-1'>
											<p className='text-xs text-muted-foreground'>Driver ID</p>
											<p className='text-xs font-mono truncate'>{driver.id}</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										className='h-8 w-8 shrink-0'
										onClick={() => copyToClipboard(driver.id, 'Driver ID')}
									>
										<IconCopy className='h-4 w-4' />
									</Button>
								</div>

								<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
									<IconCalendar className='h-4 w-4 text-muted-foreground shrink-0' />
									<div className='min-w-0'>
										<p className='text-xs text-muted-foreground'>Applied</p>
										<p className='text-sm font-medium'>
											{formatDate(driver.created_at)}
										</p>
									</div>
								</div>
							</div>
						</div>

						<Separator />

						{/* Status Section */}
						<div className='space-y-3'>
							<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
								Status
							</h4>

							<div className='grid grid-cols-2 gap-2'>
								<div className='rounded-md border px-3 py-2.5'>
									<p className='text-xs text-muted-foreground'>Approval</p>
									<p className='text-sm font-medium'>
										{driver.approval_status === 'approved' ? (
											<span className='text-green-600'>Approved</span>
										) : driver.approval_status === 'rejected' ? (
											<span className='text-red-600'>Rejected</span>
										) : (
											<span className='text-orange-600'>Pending</span>
										)}
									</p>
								</div>
								<div className='rounded-md border px-3 py-2.5'>
									<p className='text-xs text-muted-foreground'>Online</p>
									<p className='text-sm font-medium'>
										{driver.is_online ? (
											<span className='text-green-600 flex items-center gap-1'>
												<IconCloudCheck className='h-4 w-4' />
												Yes
											</span>
										) : (
											<span className='text-muted-foreground flex items-center gap-1'>
												<IconCloudOff className='h-4 w-4' />
												No
											</span>
										)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<SheetFooter>
					{isPending ? (
						<div className='flex gap-2 w-full'>
							<Button
								variant='destructive'
								className='flex-1'
								onClick={onReject}
							>
								<IconUserX className='h-4 w-4 mr-2' />
								Reject
							</Button>
							<Button
								className='flex-1 bg-green-600 hover:bg-green-700 text-white'
								onClick={onApprove}
							>
								<IconUserCheck className='h-4 w-4 mr-2' />
								Approve
							</Button>
						</div>
					) : (
						<Button variant='outline' className='w-full' onClick={() => onOpenChange(false)}>
							Close
						</Button>
					)}
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
