'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import {
	IconArrowLeft,
	IconRefresh,
	IconCar,
	IconCheck,
	IconX,
	IconShield,
	IconAlertTriangle,
	IconCopy,
	IconExternalLink,
	IconUsers,
	IconBolt,
	IconBabyCarriage,
	IconWifi,
	IconDog,
	IconWheelchair,
	IconPackage,
	IconCalendar,
	IconId,
	IconClock,
} from '@tabler/icons-react';
import { vehiclesService } from '@/lib/api/vehicles.service';
import { Vehicle, VehicleStatus, VehicleCategory, FuelType } from '@/lib/types/vehicles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
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

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(date?: string) {
	if (!date) return '—';
	return new Date(date).toLocaleDateString('en-US', {
		year: 'numeric', month: 'long', day: 'numeric',
	});
}

function formatDateTime(date?: string) {
	if (!date) return '—';
	return new Date(date).toLocaleString('en-US', {
		year: 'numeric', month: 'short', day: 'numeric',
		hour: '2-digit', minute: '2-digit',
	});
}

function daysUntil(date?: string): number | null {
	if (!date) return null;
	return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getStatusStyle(status: VehicleStatus) {
	const map: Record<VehicleStatus, string> = {
		pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200',
		approved: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200',
		rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200',
		suspended: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200',
		retired: 'bg-muted text-muted-foreground',
	};
	return map[status] ?? 'bg-muted text-muted-foreground';
}

function getCategoryLabel(cat: VehicleCategory): string {
	return { economy: 'Economy', comfort: 'Comfort', premium: 'Premium', lux: 'Luxury', xl: 'XL', wav: 'Wheelchair Accessible', electric: 'Electric' }[cat] ?? cat;
}

function getFuelLabel(fuel: FuelType): string {
	return { gasoline: 'Gasoline', diesel: 'Diesel', electric: 'Electric', hybrid: 'Hybrid', cng: 'CNG', lpg: 'LPG' }[fuel] ?? fuel;
}

function ExpiryRow({ label, date }: { label: string; date?: string }) {
	const days = daysUntil(date);
	let badge = <span className='text-muted-foreground text-sm'>—</span>;
	if (days !== null) {
		if (days < 0) badge = <Badge className='bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'>Expired {Math.abs(days)}d ago</Badge>;
		else if (days <= 7) badge = <Badge className='bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'>Expires in {days}d</Badge>;
		else if (days <= 30) badge = <Badge className='bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'>Expires in {days}d</Badge>;
		else badge = <Badge variant='outline'>{formatDate(date)}</Badge>;
	}
	return (
		<div className='flex items-center justify-between py-2'>
			<span className='text-sm text-muted-foreground'>{label}</span>
			{badge}
		</div>
	);
}

function PhotoCard({ label, url }: { label: string; url?: string }) {
	if (!url) {
		return (
			<div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center gap-2'>
				<IconCar className='h-8 w-8 text-muted-foreground' />
				<p className='text-xs text-muted-foreground'>{label}</p>
				<p className='text-xs text-muted-foreground'>Not uploaded</p>
			</div>
		);
	}
	return (
		<a
			href={url}
			target='_blank'
			rel='noopener noreferrer'
			className='group flex flex-col items-center justify-center rounded-lg border p-4 gap-2 hover:bg-accent transition-colors'
		>
			<IconExternalLink className='h-5 w-5 text-muted-foreground group-hover:text-foreground' />
			<p className='text-xs font-medium'>{label}</p>
			<p className='text-xs text-blue-600 dark:text-blue-400 truncate max-w-full'>View photo</p>
		</a>
	);
}

function AmenityRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: boolean }) {
	return (
		<div className='flex items-center justify-between py-1.5'>
			<div className='flex items-center gap-2 text-sm text-muted-foreground'>
				{icon}
				{label}
			</div>
			{value ? (
				<Badge className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs'>Yes</Badge>
			) : (
				<Badge variant='secondary' className='text-xs'>No</Badge>
			)}
		</div>
	);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function VehicleDetailPage() {
	const params = useParams();
	const router = useRouter();
	const vehicleId = params.id as string;

	const [vehicle, setVehicle] = useState<Vehicle | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Review dialog
	const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
	const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
	const [rejectionReason, setRejectionReason] = useState('');
	const [isSubmittingReview, setIsSubmittingReview] = useState(false);

	// Suspend dialog
	const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
	const [suspendReason, setSuspendReason] = useState('');
	const [isSubmittingSuspend, setIsSubmittingSuspend] = useState(false);

	const fetchVehicle = async () => {
		try {
			setIsLoading(true);
			// Fetch via the all-vehicles list filtered by a single vehicle isn't directly available,
			// so we get the list and find by id, or use getAll with search.
			// Since there's no single GET /admin/vehicles/:id endpoint, use the all list with
			// the exact driver's vehicle. We'll fetch all and find our vehicle.
			const res = await vehiclesService.getAll({ limit: 1, offset: 0, search: vehicleId });
			// If backend search doesn't match UUIDs, fall back to fetching list
			// and letting the page handle not-found gracefully.
			if (res.data.length > 0 && res.data[0].id === vehicleId) {
				setVehicle(res.data[0]);
			} else {
				// Try fetching without filter and scan through pending list
				const pending = await vehiclesService.getPending({ limit: 50, offset: 0 });
				const found = pending.data.find(v => v.id === vehicleId);
				if (found) {
					setVehicle(found);
				} else {
					// Try all vehicles
					const all = await vehiclesService.getAll({ limit: 100, offset: 0 });
					const foundAll = all.data.find(v => v.id === vehicleId);
					setVehicle(foundAll ?? null);
					if (!foundAll) toast.error('Vehicle not found');
				}
			}
		} catch (error) {
			toast.error('Failed to load vehicle', { description: error instanceof Error ? error.message : undefined });
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchVehicle();
	}, [vehicleId]); // eslint-disable-line

	const copyToClipboard = (value: string, label: string) => {
		navigator.clipboard.writeText(value);
		toast.success(`${label} copied`);
	};

	// ── Review ────────────────────────────────────────────────────────────────

	const openApprove = () => { setReviewAction('approve'); setRejectionReason(''); setReviewDialogOpen(true); };
	const openReject = () => { setReviewAction('reject'); setRejectionReason(''); setReviewDialogOpen(true); };

	const submitReview = async () => {
		if (!vehicle) return;
		if (reviewAction === 'reject' && !rejectionReason.trim()) {
			toast.error('Rejection reason is required');
			return;
		}
		try {
			setIsSubmittingReview(true);
			await vehiclesService.reviewVehicle(vehicle.id, {
				approved: reviewAction === 'approve',
				rejection_reason: reviewAction === 'reject' ? rejectionReason.trim() : undefined,
			});
			toast.success(`Vehicle ${reviewAction === 'approve' ? 'approved' : 'rejected'}`);
			setReviewDialogOpen(false);
			fetchVehicle();
		} catch (error) {
			toast.error('Failed', { description: error instanceof Error ? error.message : undefined });
		} finally {
			setIsSubmittingReview(false);
		}
	};

	// ── Suspend ───────────────────────────────────────────────────────────────

	const submitSuspend = async () => {
		if (!vehicle || !suspendReason.trim()) return;
		try {
			setIsSubmittingSuspend(true);
			await vehiclesService.suspendVehicle(vehicle.id, { reason: suspendReason.trim() });
			toast.success('Vehicle suspended');
			setSuspendDialogOpen(false);
			fetchVehicle();
		} catch (error) {
			toast.error('Failed to suspend', { description: error instanceof Error ? error.message : undefined });
		} finally {
			setIsSubmittingSuspend(false);
		}
	};

	// ── Loading ───────────────────────────────────────────────────────────────

	if (isLoading) {
		return (
			<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
				<Skeleton className='h-8 w-64' />
				<div className='grid gap-6 lg:grid-cols-3'>
					<Skeleton className='h-96' />
					<div className='lg:col-span-2 space-y-4'>
						<Skeleton className='h-10 w-72' />
						<Skeleton className='h-64' />
					</div>
				</div>
			</div>
		);
	}

	if (!vehicle) {
		return (
			<div className='flex flex-1 items-center justify-center p-8'>
				<div className='text-center'>
					<IconCar className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
					<h2 className='text-xl font-semibold mb-2'>Vehicle not found</h2>
					<Button variant='outline' onClick={() => router.back()}>
						<IconArrowLeft className='h-4 w-4 mr-2' />
						Go back
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<Button variant='ghost' size='sm' onClick={() => router.back()}>
						<IconArrowLeft className='h-4 w-4' />
					</Button>
					<div>
						<h1 className='text-xl font-semibold'>
							{vehicle.year} {vehicle.make} {vehicle.model}
						</h1>
						<div className='flex items-center gap-2 mt-0.5'>
							<p className='text-sm text-muted-foreground'>
								<Link href='/dashboard/vehicles' className='hover:underline'>Vehicles</Link>
								{' / '}
								<span>{vehicle.license_plate}</span>
							</p>
						</div>
					</div>
				</div>
				<Button variant='outline' size='sm' onClick={fetchVehicle}>
					<IconRefresh className='h-4 w-4 mr-2' />
					Refresh
				</Button>
			</div>

			{/* Main layout */}
			<div className='grid gap-6 lg:grid-cols-3'>
				{/* Left: Identity + Actions */}
				<div className='space-y-4'>
					{/* Identity card */}
					<Card>
						<CardContent className='pt-6'>
							<div className='flex flex-col items-center text-center gap-3'>
								<div className='rounded-full bg-muted p-4'>
									<IconCar className='h-10 w-10 text-muted-foreground' />
								</div>
								<div>
									<h2 className='text-lg font-semibold'>{vehicle.year} {vehicle.make} {vehicle.model}</h2>
									<p className='text-sm text-muted-foreground capitalize'>{vehicle.color}</p>
								</div>
								<Badge className={getStatusStyle(vehicle.status)}>
									{vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
								</Badge>
								{vehicle.is_primary && (
									<Badge variant='outline' className='text-xs'>Primary Vehicle</Badge>
								)}
							</div>

							<Separator className='my-4' />

							<div className='space-y-3 text-sm'>
								<div className='flex items-center justify-between'>
									<span className='text-muted-foreground flex items-center gap-1.5'>
										<IconId className='h-4 w-4' /> License Plate
									</span>
									<div className='flex items-center gap-1'>
										<code className='font-mono font-medium'>{vehicle.license_plate}</code>
										<button onClick={() => copyToClipboard(vehicle.license_plate, 'Plate')} className='p-0.5 hover:text-foreground text-muted-foreground'>
											<IconCopy className='h-3.5 w-3.5' />
										</button>
									</div>
								</div>
								{vehicle.vin && (
									<div className='flex items-center justify-between'>
										<span className='text-muted-foreground'>VIN</span>
										<div className='flex items-center gap-1'>
											<code className='font-mono text-xs'>{vehicle.vin.slice(-8)}</code>
											<button onClick={() => copyToClipboard(vehicle.vin!, 'VIN')} className='p-0.5 hover:text-foreground text-muted-foreground'>
												<IconCopy className='h-3.5 w-3.5' />
											</button>
										</div>
									</div>
								)}
								<div className='flex items-center justify-between'>
									<span className='text-muted-foreground'>Category</span>
									<span className='font-medium'>{getCategoryLabel(vehicle.category)}</span>
								</div>
								<div className='flex items-center justify-between'>
									<span className='text-muted-foreground'>Fuel</span>
									<span className='font-medium'>{getFuelLabel(vehicle.fuel_type)}</span>
								</div>
								<div className='flex items-center justify-between'>
									<span className='text-muted-foreground flex items-center gap-1.5'>
										<IconCalendar className='h-4 w-4' /> Registered
									</span>
									<span className='text-xs'>{formatDate(vehicle.created_at)}</span>
								</div>
								<div className='flex items-center justify-between'>
									<span className='text-muted-foreground flex items-center gap-1.5'>
										<IconClock className='h-4 w-4' /> Updated
									</span>
									<span className='text-xs'>{formatDateTime(vehicle.updated_at)}</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Quick Actions */}
					{(vehicle.status === 'pending' || vehicle.status === 'approved') && (
						<Card>
							<CardHeader className='pb-3'>
								<CardTitle className='text-sm'>Quick Actions</CardTitle>
							</CardHeader>
							<CardContent className='space-y-2'>
								{vehicle.status === 'pending' && (
									<>
										<Button
											className='w-full bg-green-600 hover:bg-green-700 text-white'
											size='sm'
											onClick={openApprove}
										>
											<IconCheck className='h-4 w-4 mr-2' />
											Approve Vehicle
										</Button>
										<Button
											variant='outline'
											size='sm'
											className='w-full border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950'
											onClick={openReject}
										>
											<IconX className='h-4 w-4 mr-2' />
											Reject Vehicle
										</Button>
									</>
								)}
								{vehicle.status === 'approved' && (
									<Button
										variant='outline'
										size='sm'
										className='w-full border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950'
										onClick={() => { setSuspendReason(''); setSuspendDialogOpen(true); }}
									>
										<IconShield className='h-4 w-4 mr-2' />
										Suspend Vehicle
									</Button>
								)}
							</CardContent>
						</Card>
					)}

					{/* Rejection reason (if rejected) */}
					{vehicle.status === 'rejected' && vehicle.rejection_reason && (
						<Card className='border-red-200 dark:border-red-800'>
							<CardHeader className='pb-2'>
								<CardTitle className='text-sm flex items-center gap-2 text-red-700 dark:text-red-400'>
									<IconAlertTriangle className='h-4 w-4' />
									Rejection Reason
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-sm text-muted-foreground'>{vehicle.rejection_reason}</p>
							</CardContent>
						</Card>
					)}

					{/* Suspension reason (if suspended) */}
					{vehicle.status === 'suspended' && vehicle.rejection_reason && (
						<Card className='border-orange-200 dark:border-orange-800'>
							<CardHeader className='pb-2'>
								<CardTitle className='text-sm flex items-center gap-2 text-orange-700 dark:text-orange-400'>
									<IconShield className='h-4 w-4' />
									Suspension Reason
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className='text-sm text-muted-foreground'>{vehicle.rejection_reason}</p>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Right: Tabs */}
				<div className='lg:col-span-2'>
					<Tabs defaultValue='details'>
						<TabsList>
							<TabsTrigger value='details'>Details</TabsTrigger>
							<TabsTrigger value='documents'>Document Expiry</TabsTrigger>
							<TabsTrigger value='photos'>Photos</TabsTrigger>
							<TabsTrigger value='driver'>Driver</TabsTrigger>
						</TabsList>

						{/* Details tab */}
						<TabsContent value='details' className='mt-4 space-y-4'>
							<Card>
								<CardHeader>
									<CardTitle className='text-base'>Specifications</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='grid grid-cols-2 gap-x-8 gap-y-3 text-sm'>
										<div>
											<p className='text-muted-foreground'>Make</p>
											<p className='font-medium'>{vehicle.make}</p>
										</div>
										<div>
											<p className='text-muted-foreground'>Model</p>
											<p className='font-medium'>{vehicle.model}</p>
										</div>
										<div>
											<p className='text-muted-foreground'>Year</p>
											<p className='font-medium'>{vehicle.year}</p>
										</div>
										<div>
											<p className='text-muted-foreground'>Color</p>
											<p className='font-medium capitalize'>{vehicle.color}</p>
										</div>
										<div>
											<p className='text-muted-foreground'>Category</p>
											<p className='font-medium'>{getCategoryLabel(vehicle.category)}</p>
										</div>
										<div>
											<p className='text-muted-foreground'>Fuel Type</p>
											<p className='font-medium'>{getFuelLabel(vehicle.fuel_type)}</p>
										</div>
										<div>
											<p className='text-muted-foreground'>Max Passengers</p>
											<p className='font-medium'>{vehicle.max_passengers}</p>
										</div>
										<div>
											<p className='text-muted-foreground'>Luggage Capacity</p>
											<p className='font-medium'>{vehicle.luggage_capacity} bag{vehicle.luggage_capacity !== 1 ? 's' : ''}</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle className='text-base'>Amenities</CardTitle>
									<CardDescription>Features available to riders</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='divide-y'>
										<AmenityRow icon={<IconBabyCarriage className='h-4 w-4' />} label='Child Seat' value={vehicle.has_child_seat} />
										<AmenityRow icon={<IconWheelchair className='h-4 w-4' />} label='Wheelchair Access' value={vehicle.has_wheelchair_access} />
										<AmenityRow icon={<IconWifi className='h-4 w-4' />} label='Wi-Fi' value={vehicle.has_wifi} />
										<AmenityRow icon={<IconBolt className='h-4 w-4' />} label='Phone Charger' value={vehicle.has_charger} />
										<AmenityRow icon={<IconDog className='h-4 w-4' />} label='Pet Friendly' value={vehicle.pet_friendly} />
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Document Expiry tab */}
						<TabsContent value='documents' className='mt-4'>
							<Card>
								<CardHeader>
									<CardTitle className='text-base'>Document Expiry Dates</CardTitle>
									<CardDescription>Track when vehicle documents need renewal</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='divide-y'>
										<ExpiryRow label='Insurance' date={vehicle.insurance_expiry} />
										<ExpiryRow label='Registration' date={vehicle.registration_expiry} />
										<ExpiryRow label='Inspection' date={vehicle.inspection_expiry} />
									</div>
									{!vehicle.insurance_expiry && !vehicle.registration_expiry && !vehicle.inspection_expiry && (
										<p className='text-sm text-muted-foreground text-center py-4'>
											No expiry dates have been set for this vehicle.
										</p>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						{/* Photos tab */}
						<TabsContent value='photos' className='mt-4'>
							<Card>
								<CardHeader>
									<CardTitle className='text-base'>Vehicle Photos</CardTitle>
									<CardDescription>Review uploaded photos for this vehicle</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
										<PhotoCard label='Front' url={vehicle.front_photo_url} />
										<PhotoCard label='Back' url={vehicle.back_photo_url} />
										<PhotoCard label='Side' url={vehicle.side_photo_url} />
										<PhotoCard label='Interior' url={vehicle.interior_photo_url} />
										<PhotoCard label='Registration' url={vehicle.registration_photo_url} />
										<PhotoCard label='Insurance' url={vehicle.insurance_photo_url} />
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Driver tab */}
						<TabsContent value='driver' className='mt-4'>
							<Card>
								<CardHeader>
									<CardTitle className='text-base'>Assigned Driver</CardTitle>
									<CardDescription>The driver who registered this vehicle</CardDescription>
								</CardHeader>
								<CardContent>
									<div className='flex items-center justify-between p-4 rounded-lg border'>
										<div className='flex items-center gap-3'>
											<div className='rounded-full bg-muted p-2'>
												<IconUsers className='h-5 w-5 text-muted-foreground' />
											</div>
											<div>
												<p className='font-medium'>{vehicle.driver_name ?? 'Unknown Driver'}</p>
												<p className='text-xs text-muted-foreground font-mono'>{vehicle.driver_id}</p>
											</div>
										</div>
										<Link href={`/dashboard/drivers/${vehicle.driver_id}`}>
											<Button size='sm' variant='outline'>
												View Driver
											</Button>
										</Link>
									</div>
									<div className='mt-3 flex items-center gap-2'>
										<p className='text-xs text-muted-foreground'>Driver ID:</p>
										<code className='text-xs font-mono'>{vehicle.driver_id}</code>
										<button
											onClick={() => copyToClipboard(vehicle.driver_id, 'Driver ID')}
											className='p-0.5 text-muted-foreground hover:text-foreground'
										>
											<IconCopy className='h-3.5 w-3.5' />
										</button>
									</div>
								</CardContent>
							</Card>

							{/* Vehicle ID card */}
							<Card className='mt-4'>
								<CardHeader className='pb-2'>
									<CardTitle className='text-sm text-muted-foreground'>Vehicle ID</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='flex items-center gap-2'>
										<code className='text-xs font-mono bg-muted px-2 py-1 rounded flex-1 truncate'>{vehicle.id}</code>
										<button
											onClick={() => copyToClipboard(vehicle.id, 'Vehicle ID')}
											className='p-1 text-muted-foreground hover:text-foreground shrink-0'
										>
											<IconCopy className='h-4 w-4' />
										</button>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>
			</div>

			{/* ── Review Dialog ──────────────────────────────────────────────── */}
			<Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>{reviewAction === 'approve' ? 'Approve Vehicle' : 'Reject Vehicle'}</DialogTitle>
						<DialogDescription>
							{vehicle.year} {vehicle.make} {vehicle.model} — {vehicle.license_plate}
						</DialogDescription>
					</DialogHeader>
					{reviewAction === 'approve' ? (
						<div className='flex items-start gap-3 rounded-lg bg-green-50 dark:bg-green-950 p-4 text-sm'>
							<IconCheck className='h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5' />
							<div>
								<p className='font-medium text-green-800 dark:text-green-200'>Approve this vehicle?</p>
								<p className='text-green-700 dark:text-green-300 mt-1'>The driver will be able to go online and accept rides with this vehicle.</p>
							</div>
						</div>
					) : (
						<div className='space-y-3'>
							<div className='flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-950 p-4 text-sm'>
								<IconX className='h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5' />
								<p className='text-red-800 dark:text-red-200'>The driver will be notified and asked to resubmit with corrections.</p>
							</div>
							<div className='space-y-1.5'>
								<Label htmlFor='detail-rejection-reason'>
									Rejection reason <span className='text-destructive'>*</span>
								</Label>
								<Textarea
									id='detail-rejection-reason'
									placeholder='Explain why this vehicle is being rejected…'
									rows={3}
									value={rejectionReason}
									onChange={(e) => setRejectionReason(e.target.value)}
								/>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button variant='outline' onClick={() => setReviewDialogOpen(false)} disabled={isSubmittingReview}>Cancel</Button>
						<Button
							variant={reviewAction === 'approve' ? 'default' : 'destructive'}
							onClick={submitReview}
							disabled={isSubmittingReview || (reviewAction === 'reject' && !rejectionReason.trim())}
						>
							{isSubmittingReview ? 'Submitting…' : reviewAction === 'approve' ? 'Approve Vehicle' : 'Reject Vehicle'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Suspend Dialog ─────────────────────────────────────────────── */}
			<AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Suspend Vehicle</AlertDialogTitle>
						<AlertDialogDescription>
							{vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.license_plate}) will be suspended and the driver won&apos;t be able to use it.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className='px-6 pb-2 space-y-1.5'>
						<Label htmlFor='detail-suspend-reason'>
							Reason <span className='text-destructive'>*</span>
						</Label>
						<Textarea
							id='detail-suspend-reason'
							placeholder='Reason for suspension…'
							rows={3}
							value={suspendReason}
							onChange={(e) => setSuspendReason(e.target.value)}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSubmittingSuspend}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className='bg-destructive hover:bg-destructive/90'
							onClick={submitSuspend}
							disabled={isSubmittingSuspend || !suspendReason.trim()}
						>
							{isSubmittingSuspend ? 'Suspending…' : 'Suspend Vehicle'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
