'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
	IconRefresh,
	IconGavel,
	IconClock,
	IconSearch as IconSearchCheck,
	IconCheck,
	IconX,
	IconAlertTriangle,
	IconDots,
	IconEye,
	IconChevronUp,
	IconChevronDown,
} from '@tabler/icons-react';
import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { supportService } from '@/lib/api/support.service';
import {
	Dispute,
	DisputeStatus,
	DisputeResolutionType,
	ResolveDisputeRequest,
} from '@/lib/types/support';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

// ==================== Helpers ====================

const statusBadgeClasses: Record<DisputeStatus, string> = {
	open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
	under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
	resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
	rejected: '',
	escalated: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const statusLabels: Record<DisputeStatus, string> = {
	open: 'Open',
	under_review: 'Under Review',
	resolved: 'Resolved',
	rejected: 'Rejected',
	escalated: 'Escalated',
};

const resolutionTypeLabels: Record<DisputeResolutionType, string> = {
	full_refund: 'Full Refund',
	partial_refund: 'Partial Refund',
	credit: 'Account Credit',
	no_action: 'No Action',
	driver_penalty: 'Driver Penalty',
};

function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(value);
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
}

function formatDateTime(dateStr: string): string {
	const d = new Date(dateStr);
	return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

function StatusBadge({ status }: { status: DisputeStatus }) {
	if (status === 'rejected') {
		return (
			<Badge variant='destructive'>
				{statusLabels[status]}
			</Badge>
		);
	}

	return (
		<Badge variant='secondary' className={statusBadgeClasses[status]}>
			{statusLabels[status]}
		</Badge>
	);
}

// ==================== Table Columns ====================

function ActionCell({
	dispute,
	onAction,
}: {
	dispute: Dispute;
	onAction: (action: 'view' | 'review' | 'resolve' | 'reject' | 'escalate', id: string) => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' className='h-8 w-8 p-0'>
					<span className='sr-only'>Open menu</span>
					<IconDots className='h-4 w-4' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end'>
				<DropdownMenuLabel>Actions</DropdownMenuLabel>
				<DropdownMenuItem onSelect={() => onAction('view', dispute.id)}>
					<IconEye className='mr-2 h-4 w-4' />
					View details
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{dispute.status === 'open' && (
					<DropdownMenuItem onSelect={() => onAction('review', dispute.id)}>
						<IconSearchCheck className='mr-2 h-4 w-4' />
						Start review
					</DropdownMenuItem>
				)}
				{(dispute.status === 'open' || dispute.status === 'under_review') && (
					<DropdownMenuItem onSelect={() => onAction('resolve', dispute.id)}>
						<IconCheck className='mr-2 h-4 w-4' />
						Resolve
					</DropdownMenuItem>
				)}
				{(dispute.status === 'open' || dispute.status === 'under_review') && (
					<DropdownMenuItem onSelect={() => onAction('reject', dispute.id)}>
						<IconX className='mr-2 h-4 w-4' />
						Reject
					</DropdownMenuItem>
				)}
				{(dispute.status === 'open' || dispute.status === 'under_review') && (
					<DropdownMenuItem onSelect={() => onAction('escalate', dispute.id)}>
						<IconAlertTriangle className='mr-2 h-4 w-4' />
						Escalate
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function createColumns(
	onAction: (action: 'view' | 'review' | 'resolve' | 'reject' | 'escalate', id: string) => void,
): ColumnDef<Dispute>[] {
	return [
		{
			accessorKey: 'ride_id',
			header: 'Ride ID',
			cell: ({ row }) => {
				const id = row.getValue('ride_id') as string;
				return (
					<div className='font-mono text-xs truncate max-w-25' title={id}>
						{id.substring(0, 8)}...
					</div>
				);
			},
		},
		{
			accessorKey: 'rider_name',
			header: 'Rider',
			cell: ({ row }) => {
				const name = row.original.rider_name;
				return (
					<div className='text-sm'>
						{name || <span className='text-muted-foreground'>Unknown</span>}
					</div>
				);
			},
		},
		{
			accessorKey: 'driver_name',
			header: 'Driver',
			cell: ({ row }) => {
				const name = row.original.driver_name;
				return (
					<div className='text-sm'>
						{name || <span className='text-muted-foreground'>N/A</span>}
					</div>
				);
			},
		},
		{
			accessorKey: 'reason',
			header: 'Reason',
			cell: ({ row }) => {
				const reason = row.getValue('reason') as string;
				return (
					<div className='max-w-40 truncate text-sm text-muted-foreground' title={reason}>
						{reason}
					</div>
				);
			},
		},
		{
			accessorKey: 'ride_fare',
			header: 'Amount',
			cell: ({ row }) => {
				const fare = row.original.ride_fare;
				return (
					<div className='text-sm font-medium'>
						{fare != null ? formatCurrency(fare) : '-'}
					</div>
				);
			},
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => <StatusBadge status={row.getValue('status') as DisputeStatus} />,
		},
		{
			accessorKey: 'created_at',
			header: 'Created',
			cell: ({ row }) => (
				<div className='text-sm text-muted-foreground'>
					{formatDate(row.getValue('created_at') as string)}
				</div>
			),
		},
		{
			id: 'actions',
			cell: ({ row }) => <ActionCell dispute={row.original} onAction={onAction} />,
		},
	];
}

// ==================== Main Page Component ====================

const resolveSchema = z.object({
	resolution_notes: z.string().trim().min(1, 'Resolution notes are required'),
	refund_amount: z.string(),
	credit_amount: z.string(),
});
type ResolveFormValues = z.infer<typeof resolveSchema>;

export default function DisputesPage() {
	// Data state
	const [disputes, setDisputes] = useState<Dispute[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [pagination, setPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [sorting, setSorting] = useState<SortingState>([]);

	// Stats
	const [stats, setStats] = useState({
		open: 0,
		under_review: 0,
		resolved: 0,
		escalated: 0,
	});

	// Detail sheet state
	const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isLoadingDetail, setIsLoadingDetail] = useState(false);

	// Resolve dialog state
	const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
	const [resolveResolutionType, setResolveResolutionType] = useState<DisputeResolutionType>('no_action');
	const resolveForm = useForm<ResolveFormValues>({
		resolver: zodResolver(resolveSchema),
		defaultValues: { resolution_notes: '', refund_amount: '', credit_amount: '' },
	});

	// Reject dialog state
	const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
	const [rejectReason, setRejectReason] = useState('');
	const [isRejecting, setIsRejecting] = useState(false);

	// Escalate dialog state
	const [isEscalateDialogOpen, setIsEscalateDialogOpen] = useState(false);
	const [escalateNotes, setEscalateNotes] = useState('');
	const [isEscalating, setIsEscalating] = useState(false);

	// ==================== Data Fetching ====================

	const fetchDisputes = useCallback(async () => {
		try {
			setIsLoading(true);
			const params: Record<string, string | number> = {
				limit: pagination.limit,
				offset: pagination.offset,
			};

			if (statusFilter && statusFilter !== 'all') {
				params.status = statusFilter;
			}

			const response = await supportService.getDisputes(params);
			setDisputes(response.data);
			setPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));

			// Extract stats from meta if available, otherwise estimate from data
			const meta = response.meta as { total: number; stats?: Record<string, number> };
			if (meta.stats) {
				setStats({
					open: meta.stats.open ?? 0,
					under_review: meta.stats.under_review ?? 0,
					resolved: meta.stats.resolved ?? 0,
					escalated: meta.stats.escalated ?? 0,
				});
			} else {
				setStats({
					open: response.data.filter((d) => d.status === 'open').length,
					under_review: response.data.filter((d) => d.status === 'under_review').length,
					resolved: response.data.filter((d) => d.status === 'resolved').length,
					escalated: response.data.filter((d) => d.status === 'escalated').length,
				});
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load disputes';
			toast.error('Failed to load disputes', { description: errorMessage });
		} finally {
			setIsLoading(false);
		}
	}, [pagination.limit, pagination.offset, statusFilter]);

	useEffect(() => {
		fetchDisputes();
	}, [fetchDisputes]);

	// ==================== Table ====================

	const handleAction = useCallback(
		async (action: 'view' | 'review' | 'resolve' | 'reject' | 'escalate', disputeId: string) => {
			const dispute = disputes.find((d) => d.id === disputeId);
			if (!dispute) return;

			if (action === 'view') {
				try {
					setIsLoadingDetail(true);
					setIsSheetOpen(true);
					const fullDispute = await supportService.getDispute(disputeId);
					setSelectedDispute(fullDispute);
				} catch {
					toast.error('Failed to load dispute details');
					setIsSheetOpen(false);
				} finally {
					setIsLoadingDetail(false);
				}
				return;
			}

			if (action === 'review') {
				try {
					await supportService.reviewDispute(disputeId);
					toast.success('Dispute is now under review');
					fetchDisputes();
				} catch {
					toast.error('Failed to start review');
				}
				return;
			}

			// For resolve/reject/escalate, set selected dispute and open the relevant dialog
			setSelectedDispute(dispute);

			if (action === 'resolve') {
				setResolveResolutionType('no_action');
				resolveForm.reset({ resolution_notes: '', refund_amount: '', credit_amount: '' });
				setIsResolveDialogOpen(true);
			} else if (action === 'reject') {
				setRejectReason('');
				setIsRejectDialogOpen(true);
			} else if (action === 'escalate') {
				setEscalateNotes('');
				setIsEscalateDialogOpen(true);
			}
		},
		[disputes, fetchDisputes, resolveForm],
	);

	const columns = useMemo(() => createColumns(handleAction), [handleAction]);

	const table = useReactTable({
		data: disputes,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		state: { sorting },
	});

	const totalPages = Math.ceil(pagination.total / pagination.limit);
	const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	// ==================== Actions ====================

	const onResolveSubmit = async (values: ResolveFormValues) => {
		if (!selectedDispute) return;

		try {
			const data: ResolveDisputeRequest = {
				resolution_type: resolveResolutionType,
				resolution_notes: values.resolution_notes.trim(),
			};

			if (
				(resolveResolutionType === 'full_refund' || resolveResolutionType === 'partial_refund') &&
				values.refund_amount
			) {
				data.refund_amount = parseFloat(values.refund_amount);
			}

			if (resolveResolutionType === 'credit' && values.credit_amount) {
				data.credit_amount = parseFloat(values.credit_amount);
			}

			await supportService.resolveDispute(selectedDispute.id, data);
			toast.success('Dispute resolved successfully');
			setIsResolveDialogOpen(false);
			setIsSheetOpen(false);
			setSelectedDispute(null);
			fetchDisputes();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to resolve dispute';
			toast.error('Failed to resolve dispute', { description: errorMessage });
		}
	};

	const handleRejectSubmit = async () => {
		if (!selectedDispute) return;

		if (!rejectReason.trim()) {
			toast.error('Please provide a reason for rejection');
			return;
		}

		try {
			setIsRejecting(true);
			await supportService.rejectDispute(selectedDispute.id, { reason: rejectReason });
			toast.success('Dispute rejected');
			setIsRejectDialogOpen(false);
			setIsSheetOpen(false);
			setSelectedDispute(null);
			fetchDisputes();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to reject dispute';
			toast.error('Failed to reject dispute', { description: errorMessage });
		} finally {
			setIsRejecting(false);
		}
	};

	const handleEscalateSubmit = async () => {
		if (!selectedDispute) return;

		try {
			setIsEscalating(true);
			await supportService.escalateDispute(selectedDispute.id, {
				notes: escalateNotes || undefined,
			});
			toast.success('Dispute escalated');
			setIsEscalateDialogOpen(false);
			setIsSheetOpen(false);
			setSelectedDispute(null);
			fetchDisputes();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to escalate dispute';
			toast.error('Failed to escalate dispute', { description: errorMessage });
		} finally {
			setIsEscalating(false);
		}
	};

	const handleStartReviewFromSheet = async () => {
		if (!selectedDispute) return;

		try {
			const updated = await supportService.reviewDispute(selectedDispute.id);
			toast.success('Dispute is now under review');
			setSelectedDispute(updated);
			fetchDisputes();
		} catch {
			toast.error('Failed to start review');
		}
	};

	const handleRefresh = () => {
		fetchDisputes();
		toast.success('Disputes refreshed');
	};

	// ==================== Render ====================

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Disputes</h1>
					<p className='text-sm text-muted-foreground'>
						Review and resolve ride disputes
					</p>
				</div>
				<Button variant='outline' size='sm' onClick={handleRefresh}>
					<IconRefresh className='h-4 w-4' />
					Refresh
				</Button>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card className='border-l-4 border-l-blue-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconClock className='h-4 w-4 text-blue-600' />
							Open Disputes
						</CardDescription>
						{isLoading ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-blue-600'>{stats.open}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Awaiting review</p>
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-yellow-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconSearchCheck className='h-4 w-4 text-yellow-600' />
							Under Review
						</CardDescription>
						{isLoading ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-yellow-600'>{stats.under_review}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Being investigated</p>
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-green-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCheck className='h-4 w-4 text-green-600' />
							Resolved
						</CardDescription>
						{isLoading ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-green-600'>{stats.resolved}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Successfully resolved</p>
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-orange-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconAlertTriangle className='h-4 w-4 text-orange-600' />
							Escalated
						</CardDescription>
						{isLoading ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-orange-600'>{stats.escalated}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Needs higher attention</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters & Table */}
			<Card>
				<CardHeader>
					<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
						<div>
							<CardTitle>All Disputes</CardTitle>
							<CardDescription>
								{isLoading
									? 'Loading disputes...'
									: `Showing ${disputes.length} of ${pagination.total} disputes`}
							</CardDescription>
						</div>
						<div className='flex items-center gap-2'>
							<Select
								value={statusFilter}
								onValueChange={(value) => {
									setStatusFilter(value);
									setPagination((prev) => ({ ...prev, offset: 0 }));
								}}
							>
								<SelectTrigger className='w-[160px]'>
									<SelectValue placeholder='Filter by status' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Statuses</SelectItem>
									<SelectItem value='open'>Open</SelectItem>
									<SelectItem value='under_review'>Under Review</SelectItem>
									<SelectItem value='resolved'>Resolved</SelectItem>
									<SelectItem value='rejected'>Rejected</SelectItem>
									<SelectItem value='escalated'>Escalated</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='space-y-2'>
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className='h-16 w-full' />
							))}
						</div>
					) : disputes.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-12 text-center'>
							<IconGavel className='h-12 w-12 text-muted-foreground mb-4' />
							<h3 className='text-lg font-semibold'>No disputes found</h3>
							<p className='text-sm text-muted-foreground'>
								No disputes match your current filters.
							</p>
						</div>
					) : (
						<div className='space-y-4'>
							<div className='rounded-md border'>
								<Table>
									<TableHeader>
										{table.getHeaderGroups().map((headerGroup) => (
											<TableRow key={headerGroup.id}>
												{headerGroup.headers.map((header) => (
													<TableHead key={header.id}>
														{header.isPlaceholder ? null : (
															<div
																className={
																	header.column.getCanSort()
																		? 'flex items-center gap-2 cursor-pointer'
																		: ''
																}
																onClick={header.column.getToggleSortingHandler()}
															>
																{flexRender(
																	header.column.columnDef.header,
																	header.getContext(),
																)}
																{header.column.getCanSort() && (
																	<div className='flex flex-col'>
																		<IconChevronUp className='h-3 w-3' />
																		<IconChevronDown className='h-3 w-3 -mt-1' />
																	</div>
																)}
															</div>
														)}
													</TableHead>
												))}
											</TableRow>
										))}
									</TableHeader>
									<TableBody>
										{table.getRowModel().rows.map((row) => (
											<TableRow key={row.id}>
												{row.getVisibleCells().map((cell) => (
													<TableCell key={cell.id}>
														{flexRender(
															cell.column.columnDef.cell,
															cell.getContext(),
														)}
													</TableCell>
												))}
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							{totalPages > 1 && (
								<div className='flex items-center justify-between'>
									<p className='text-sm text-muted-foreground'>
										Showing {pagination.offset + 1} to{' '}
										{Math.min(pagination.offset + pagination.limit, pagination.total)}{' '}
										of {pagination.total} disputes
									</p>
									<div className='flex items-center gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() => handlePageChange(pagination.offset - pagination.limit)}
											disabled={currentPage === 1}
										>
											Previous
										</Button>
										<span className='text-sm'>
											Page {currentPage} of {totalPages}
										</span>
										<Button
											variant='outline'
											size='sm'
											onClick={() => handlePageChange(pagination.offset + pagination.limit)}
											disabled={currentPage === totalPages}
										>
											Next
										</Button>
									</div>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Detail Sheet */}
			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetContent className='sm:max-w-lg overflow-y-auto'>
					<SheetHeader>
						<SheetTitle className='flex items-center gap-2'>
							<IconGavel className='h-5 w-5' />
							Dispute Details
						</SheetTitle>
						<SheetDescription>
							{selectedDispute
								? `Dispute for ride ${selectedDispute.ride_id.substring(0, 8)}...`
								: 'Loading dispute details...'}
						</SheetDescription>
					</SheetHeader>

					{isLoadingDetail ? (
						<div className='space-y-4 p-4'>
							<Skeleton className='h-6 w-32' />
							<Skeleton className='h-20 w-full' />
							<Skeleton className='h-6 w-48' />
							<Skeleton className='h-20 w-full' />
						</div>
					) : selectedDispute ? (
						<div className='flex flex-col gap-6 p-4'>
							{/* Status */}
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium text-muted-foreground'>Status</span>
								<StatusBadge status={selectedDispute.status} />
							</div>

							<Separator />

							{/* Ride Info */}
							<div className='space-y-3'>
								<h4 className='text-sm font-semibold'>Ride Information</h4>
								<div className='grid grid-cols-2 gap-3'>
									<div>
										<p className='text-xs text-muted-foreground'>Ride ID</p>
										<p className='text-sm font-mono'>
											{selectedDispute.ride_id.substring(0, 12)}...
										</p>
									</div>
									<div>
										<p className='text-xs text-muted-foreground'>Fare</p>
										<p className='text-sm font-medium'>
											{selectedDispute.ride_fare != null
												? formatCurrency(selectedDispute.ride_fare)
												: 'N/A'}
										</p>
									</div>
									<div>
										<p className='text-xs text-muted-foreground'>Rider</p>
										<p className='text-sm'>{selectedDispute.rider_name || 'Unknown'}</p>
									</div>
									<div>
										<p className='text-xs text-muted-foreground'>Driver</p>
										<p className='text-sm'>{selectedDispute.driver_name || 'N/A'}</p>
									</div>
								</div>
							</div>

							<Separator />

							{/* Dispute Details */}
							<div className='space-y-3'>
								<h4 className='text-sm font-semibold'>Dispute Details</h4>
								<div>
									<p className='text-xs text-muted-foreground'>Reason</p>
									<p className='text-sm'>{selectedDispute.reason}</p>
								</div>
								<div>
									<p className='text-xs text-muted-foreground'>Description</p>
									<p className='text-sm whitespace-pre-wrap'>{selectedDispute.description}</p>
								</div>
								<div className='grid grid-cols-2 gap-3'>
									<div>
										<p className='text-xs text-muted-foreground'>Created</p>
										<p className='text-sm'>{formatDateTime(selectedDispute.created_at)}</p>
									</div>
									<div>
										<p className='text-xs text-muted-foreground'>Updated</p>
										<p className='text-sm'>{formatDateTime(selectedDispute.updated_at)}</p>
									</div>
								</div>
							</div>

							{/* Resolution Info (if resolved/rejected) */}
							{(selectedDispute.status === 'resolved' || selectedDispute.resolution_type) && (
								<>
									<Separator />
									<div className='space-y-3'>
										<h4 className='text-sm font-semibold'>Resolution</h4>
										{selectedDispute.resolution_type && (
											<div>
												<p className='text-xs text-muted-foreground'>Type</p>
												<p className='text-sm'>
													{resolutionTypeLabels[selectedDispute.resolution_type]}
												</p>
											</div>
										)}
										{selectedDispute.resolution_notes && (
											<div>
												<p className='text-xs text-muted-foreground'>Notes</p>
												<p className='text-sm whitespace-pre-wrap'>
													{selectedDispute.resolution_notes}
												</p>
											</div>
										)}
										{selectedDispute.refund_amount != null && selectedDispute.refund_amount > 0 && (
											<div>
												<p className='text-xs text-muted-foreground'>Refund Amount</p>
												<p className='text-sm font-medium text-green-600'>
													{formatCurrency(selectedDispute.refund_amount)}
												</p>
											</div>
										)}
										{selectedDispute.credit_amount != null && selectedDispute.credit_amount > 0 && (
											<div>
												<p className='text-xs text-muted-foreground'>Credit Amount</p>
												<p className='text-sm font-medium text-blue-600'>
													{formatCurrency(selectedDispute.credit_amount)}
												</p>
											</div>
										)}
										{selectedDispute.resolved_at && (
											<div>
												<p className='text-xs text-muted-foreground'>Resolved At</p>
												<p className='text-sm'>{formatDateTime(selectedDispute.resolved_at)}</p>
											</div>
										)}
									</div>
								</>
							)}

							{/* Action Buttons */}
							{(selectedDispute.status === 'open' || selectedDispute.status === 'under_review') && (
								<>
									<Separator />
									<div className='flex flex-wrap gap-2'>
										{selectedDispute.status === 'open' && (
											<Button
												size='sm'
												variant='outline'
												onClick={handleStartReviewFromSheet}
											>
												<IconSearchCheck className='mr-2 h-4 w-4' />
												Start Review
											</Button>
										)}
										<Button
											size='sm'
											onClick={() => {
												setResolveResolutionType('no_action');
												resolveForm.reset({ resolution_notes: '', refund_amount: '', credit_amount: '' });
												setIsResolveDialogOpen(true);
											}}
										>
											<IconCheck className='mr-2 h-4 w-4' />
											Resolve
										</Button>
										<Button
											size='sm'
											variant='destructive'
											onClick={() => {
												setRejectReason('');
												setIsRejectDialogOpen(true);
											}}
										>
											<IconX className='mr-2 h-4 w-4' />
											Reject
										</Button>
										<Button
											size='sm'
											variant='outline'
											className='text-orange-600 border-orange-300 hover:bg-orange-50'
											onClick={() => {
												setEscalateNotes('');
												setIsEscalateDialogOpen(true);
											}}
										>
											<IconAlertTriangle className='mr-2 h-4 w-4' />
											Escalate
										</Button>
									</div>
								</>
							)}
						</div>
					) : null}
				</SheetContent>
			</Sheet>

			{/* Resolve Dialog */}
			<Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<IconCheck className='h-5 w-5 text-green-600' />
							Resolve Dispute
						</DialogTitle>
						<DialogDescription>
							Choose a resolution type and provide details for this dispute.
						</DialogDescription>
					</DialogHeader>

					<form onSubmit={resolveForm.handleSubmit(onResolveSubmit)}>
						<div className='space-y-4'>
							<div className='space-y-2'>
								<Label htmlFor='resolution-type'>Resolution Type</Label>
								<Select
									value={resolveResolutionType}
									onValueChange={(value) => setResolveResolutionType(value as DisputeResolutionType)}
								>
									<SelectTrigger id='resolution-type'>
										<SelectValue placeholder='Select resolution type' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='full_refund'>Full Refund</SelectItem>
										<SelectItem value='partial_refund'>Partial Refund</SelectItem>
										<SelectItem value='credit'>Account Credit</SelectItem>
										<SelectItem value='no_action'>No Action</SelectItem>
										<SelectItem value='driver_penalty'>Driver Penalty</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{(resolveResolutionType === 'full_refund' || resolveResolutionType === 'partial_refund') && (
								<div className='space-y-2'>
									<Label htmlFor='refund-amount'>Refund Amount ($)</Label>
									<Input
										id='refund-amount'
										type='number'
										step='0.01'
										min='0'
										placeholder='0.00'
										{...resolveForm.register('refund_amount')}
									/>
								</div>
							)}

							{resolveResolutionType === 'credit' && (
								<div className='space-y-2'>
									<Label htmlFor='credit-amount'>Credit Amount ($)</Label>
									<Input
										id='credit-amount'
										type='number'
										step='0.01'
										min='0'
										placeholder='0.00'
										{...resolveForm.register('credit_amount')}
									/>
								</div>
							)}

							<div className='space-y-2'>
								<Label htmlFor='resolution-notes'>Resolution Notes</Label>
								<Textarea
									id='resolution-notes'
									placeholder='Provide details about the resolution...'
									rows={3}
									aria-invalid={!!resolveForm.formState.errors.resolution_notes}
									{...resolveForm.register('resolution_notes')}
								/>
								{resolveForm.formState.errors.resolution_notes && (
									<p className='text-xs text-destructive'>
										{resolveForm.formState.errors.resolution_notes.message}
									</p>
								)}
							</div>
						</div>

						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => setIsResolveDialogOpen(false)}
								disabled={resolveForm.formState.isSubmitting}
							>
								Cancel
							</Button>
							<Button
								type='submit'
								disabled={resolveForm.formState.isSubmitting}
								className='bg-green-600 text-white hover:bg-green-700'
							>
								{resolveForm.formState.isSubmitting ? 'Resolving...' : 'Resolve Dispute'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Reject Dialog */}
			<Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<IconX className='h-5 w-5 text-destructive' />
							Reject Dispute
						</DialogTitle>
						<DialogDescription>
							Provide a reason for rejecting this dispute. The rider will be notified.
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='reject-reason'>Reason for Rejection</Label>
							<Textarea
								id='reject-reason'
								placeholder='Enter the reason for rejecting this dispute...'
								value={rejectReason}
								onChange={(e) => setRejectReason(e.target.value)}
								rows={3}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setIsRejectDialogOpen(false)}
							disabled={isRejecting}
						>
							Cancel
						</Button>
						<Button
							variant='destructive'
							onClick={handleRejectSubmit}
							disabled={isRejecting || !rejectReason.trim()}
						>
							{isRejecting ? 'Rejecting...' : 'Reject Dispute'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Escalate Dialog */}
			<Dialog open={isEscalateDialogOpen} onOpenChange={setIsEscalateDialogOpen}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							<IconAlertTriangle className='h-5 w-5 text-orange-600' />
							Escalate Dispute
						</DialogTitle>
						<DialogDescription>
							Escalate this dispute for higher-level review. Optionally provide notes.
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='escalate-notes'>Notes (optional)</Label>
							<Textarea
								id='escalate-notes'
								placeholder='Add context or notes for escalation...'
								value={escalateNotes}
								onChange={(e) => setEscalateNotes(e.target.value)}
								rows={3}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setIsEscalateDialogOpen(false)}
							disabled={isEscalating}
						>
							Cancel
						</Button>
						<Button
							onClick={handleEscalateSubmit}
							disabled={isEscalating}
							className='bg-orange-600 text-white hover:bg-orange-700'
						>
							{isEscalating ? 'Escalating...' : 'Escalate Dispute'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
