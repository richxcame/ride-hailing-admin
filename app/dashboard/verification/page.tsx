'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
	IconRefresh,
	IconShieldCheck,
	IconExternalLink,
	IconPlayerPlay,
	IconCheck,
	IconX,
	IconUserShield,
} from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import { verificationService } from '@/lib/api/verification.service';
import type { Driver } from '@/lib/types/models';
import type {
	BackgroundCheck,
	BackgroundCheckStatus,
	DriverVerificationStatus,
} from '@/lib/types/verification';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

const PAGE_SIZE = 20;

type CheckState = BackgroundCheckStatus | 'not_started';

function statusBadge(state: CheckState) {
	switch (state) {
		case 'passed':
			return <Badge className='bg-green-600 hover:bg-green-600'>Passed</Badge>;
		case 'failed':
			return <Badge variant='destructive'>Failed</Badge>;
		case 'expired':
			return <Badge variant='destructive'>Expired</Badge>;
		case 'in_progress':
			return <Badge variant='secondary'>In progress</Badge>;
		case 'pending':
			return <Badge variant='secondary'>Pending</Badge>;
		default:
			return <Badge variant='outline'>Not started</Badge>;
	}
}

function driverName(driver: Driver) {
	const name = `${driver.user?.first_name ?? ''} ${driver.user?.last_name ?? ''}`.trim();
	return name || `Driver ${driver.id.slice(0, 8)}…`;
}

export default function VerificationQueuePage() {
	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [statuses, setStatuses] = useState<Record<string, DriverVerificationStatus | null>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [pagination, setPagination] = useState({ total: 0, offset: 0 });
	const [busyId, setBusyId] = useState<string | null>(null);
	const [refreshTick, setRefreshTick] = useState(0);

	// Review dialog state.
	const [review, setReview] = useState<{
		driver: Driver;
		check: BackgroundCheck;
		decision: 'passed' | 'failed';
	} | null>(null);
	const [reviewNotes, setReviewNotes] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		let active = true;
		adminService
			.getPendingDrivers({ limit: PAGE_SIZE, offset: pagination.offset })
			.then(async (res) => {
				if (!active) return;
				setDrivers(res.data);
				setPagination((p) => ({ ...p, total: res.meta.total }));
				// Resolve each driver's verification status in parallel (no list endpoint).
				const entries = await Promise.all(
					res.data.map(
						async (d) =>
							[d.id, await verificationService.getDriverVerificationStatus(d.id)] as const
					)
				);
				if (active) setStatuses(Object.fromEntries(entries));
			})
			.catch(() => active && toast.error('Failed to load verification queue'))
			.finally(() => active && setIsLoading(false));
		return () => {
			active = false;
		};
	}, [pagination.offset, refreshTick]);

	const refreshDriver = async (driverId: string) => {
		const status = await verificationService.getDriverVerificationStatus(driverId);
		setStatuses((prev) => ({ ...prev, [driverId]: status }));
	};

	const handleInitiate = async (driver: Driver) => {
		setBusyId(driver.id);
		try {
			await verificationService.initiateCheck({ driver_id: driver.id });
			toast.success(`Background check started for ${driverName(driver)}`);
			await refreshDriver(driver.id);
		} catch (err) {
			toast.error('Failed to start background check', {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setBusyId(null);
		}
	};

	const submitReview = async () => {
		if (!review) return;
		setIsSubmitting(true);
		try {
			await verificationService.reviewCheck(review.check.id, {
				status: review.decision,
				notes: reviewNotes.trim() || undefined,
			});
			toast.success(`Marked ${driverName(review.driver)} as ${review.decision}`);
			await refreshDriver(review.driver.id);
			setReview(null);
			setReviewNotes('');
		} catch (err) {
			toast.error('Failed to submit review', {
				description: err instanceof Error ? err.message : undefined,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const openReview = (driver: Driver, check: BackgroundCheck, decision: 'passed' | 'failed') => {
		setReviewNotes('');
		setReview({ driver, check, decision });
	};

	const currentPage = Math.floor(pagination.offset / PAGE_SIZE) + 1;
	const totalPages = Math.max(1, Math.ceil(pagination.total / PAGE_SIZE));

	const awaitingReview = drivers.filter((d) => {
		const s = statuses[d.id]?.background_check?.status;
		return s === 'pending' || s === 'in_progress';
	}).length;

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Verification Queue</h1>
					<p className='text-sm text-muted-foreground'>
						Run and review driver background checks before approval.
					</p>
				</div>
				<Button variant='outline' size='sm' onClick={() => setRefreshTick((t) => t + 1)}>
					<IconRefresh className='mr-2 h-4 w-4' />
					Refresh
				</Button>
			</div>

			{/* Summary */}
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Pending Drivers</CardDescription>
						<IconUserShield className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{pagination.total}</div>
						<p className='mt-1 text-xs text-muted-foreground'>Awaiting approval</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between pb-2'>
						<CardDescription>Awaiting Review</CardDescription>
						<IconShieldCheck className='h-4 w-4 text-yellow-600' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>{isLoading ? '—' : awaitingReview}</div>
						<p className='mt-1 text-xs text-muted-foreground'>Checks on this page</p>
					</CardContent>
				</Card>
			</div>

			{isLoading ? (
				<div className='space-y-2'>
					{[...Array(6)].map((_, i) => (
						<Skeleton key={i} className='h-14 w-full' />
					))}
				</div>
			) : (
				<div className='space-y-4'>
					<div className='rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Driver</TableHead>
									<TableHead>License</TableHead>
									<TableHead>Submitted</TableHead>
									<TableHead>Background Check</TableHead>
									<TableHead className='text-right'>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{drivers.length ? (
									drivers.map((driver) => {
										const check = statuses[driver.id]?.background_check;
										const state: CheckState = check?.status ?? 'not_started';
										const canReview = state === 'pending' || state === 'in_progress';
										const canInitiate =
											state === 'not_started' || state === 'failed' || state === 'expired';
										return (
											<TableRow key={driver.id}>
												<TableCell>
													<div className='flex flex-col'>
														<span className='font-medium'>{driverName(driver)}</span>
														<span className='text-xs text-muted-foreground'>
															{driver.vehicle_model} · {driver.vehicle_plate}
														</span>
													</div>
												</TableCell>
												<TableCell className='font-mono text-sm'>
													{driver.license_number || '—'}
												</TableCell>
												<TableCell className='whitespace-nowrap text-sm text-muted-foreground'>
													{new Date(driver.created_at).toLocaleDateString()}
												</TableCell>
												<TableCell>{statusBadge(state)}</TableCell>
												<TableCell>
													<div className='flex items-center justify-end gap-1.5'>
														{canInitiate && (
															<Button
																variant='outline'
																size='sm'
																disabled={busyId === driver.id}
																onClick={() => handleInitiate(driver)}
															>
																<IconPlayerPlay className='mr-1 h-3.5 w-3.5' />
																{state === 'not_started' ? 'Initiate' : 'Re-run'}
															</Button>
														)}
														{canReview && check && (
															<>
																<Button
																	variant='outline'
																	size='sm'
																	className='text-green-600'
																	onClick={() => openReview(driver, check, 'passed')}
																>
																	<IconCheck className='mr-1 h-3.5 w-3.5' />
																	Pass
																</Button>
																<Button
																	variant='outline'
																	size='sm'
																	className='text-destructive'
																	onClick={() => openReview(driver, check, 'failed')}
																>
																	<IconX className='mr-1 h-3.5 w-3.5' />
																	Fail
																</Button>
															</>
														)}
														<Button variant='ghost' size='icon' asChild>
															<Link href={`/dashboard/drivers/${driver.id}`}>
																<IconExternalLink className='h-4 w-4' />
															</Link>
														</Button>
													</div>
												</TableCell>
											</TableRow>
										);
									})
								) : (
									<TableRow>
										<TableCell colSpan={5} className='h-24 text-center'>
											<div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
												<IconShieldCheck className='h-8 w-8' />
												<span>No drivers awaiting verification.</span>
											</div>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					{pagination.total > 0 && (
						<div className='flex items-center justify-between'>
							<p className='text-sm text-muted-foreground'>
								Showing {pagination.offset + 1} to{' '}
								{Math.min(pagination.offset + PAGE_SIZE, pagination.total)} of{' '}
								{pagination.total} drivers
							</p>
							<div className='flex items-center gap-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() =>
										setPagination((p) => ({
											...p,
											offset: Math.max(0, p.offset - PAGE_SIZE),
										}))
									}
									disabled={pagination.offset === 0}
								>
									Previous
								</Button>
								<span className='text-sm'>
									Page {currentPage} of {totalPages}
								</span>
								<Button
									variant='outline'
									size='sm'
									onClick={() =>
										setPagination((p) => ({ ...p, offset: p.offset + PAGE_SIZE }))
									}
									disabled={pagination.offset + PAGE_SIZE >= pagination.total}
								>
									Next
								</Button>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Review dialog */}
			<Dialog open={!!review} onOpenChange={(open) => !open && setReview(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{review?.decision === 'passed' ? 'Pass' : 'Fail'} background check
						</DialogTitle>
						<DialogDescription>
							{review && (
								<>
									Mark {driverName(review.driver)}&apos;s background check as{' '}
									<span
										className={
											review.decision === 'passed'
												? 'font-medium text-green-600'
												: 'font-medium text-destructive'
										}
									>
										{review.decision}
									</span>
									. This is recorded against your admin account.
								</>
							)}
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-2'>
						<Label htmlFor='review-notes'>Notes {review?.decision === 'failed' && '(recommended)'}</Label>
						<Textarea
							id='review-notes'
							value={reviewNotes}
							onChange={(e) => setReviewNotes(e.target.value)}
							placeholder='Optional context for this decision…'
							rows={3}
						/>
					</div>
					<DialogFooter>
						<Button variant='outline' onClick={() => setReview(null)} disabled={isSubmitting}>
							Cancel
						</Button>
						<Button
							onClick={submitReview}
							disabled={isSubmitting}
							className={
								review?.decision === 'failed'
									? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
									: undefined
							}
						>
							{isSubmitting ? 'Saving…' : `Confirm ${review?.decision ?? ''}`}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
