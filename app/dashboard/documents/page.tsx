'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
	IconRefresh,
	IconCheck,
	IconX,
	IconFileText,
	IconClock,
	IconAlertTriangle,
	IconChevronUp,
	IconChevronDown,
	IconExternalLink,
} from '@tabler/icons-react';
import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { documentsService } from '@/lib/api/documents.service';
import {
	DriverDocument,
	DocumentType,
	DocumentStatus,
	ReviewDocumentRequest,
} from '@/lib/types/documents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

// ==================== Helpers ====================

const documentTypeLabels: Record<DocumentType, string> = {
	drivers_license: "Driver's License",
	vehicle_registration: 'Vehicle Registration',
	insurance: 'Insurance',
	background_check: 'Background Check',
	profile_photo: 'Profile Photo',
	vehicle_photo: 'Vehicle Photo',
};

const statusBadgeClasses: Record<DocumentStatus, string> = {
	pending:
		'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
	approved:
		'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
	rejected: '',
	expired:
		'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

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

function StatusBadge({ status }: { status: DocumentStatus }) {
	if (status === 'rejected') {
		return <Badge variant='destructive'>Rejected</Badge>;
	}

	return (
		<Badge variant='secondary' className={statusBadgeClasses[status]}>
			{status.charAt(0).toUpperCase() + status.slice(1)}
		</Badge>
	);
}

function DocumentTypeBadge({ type }: { type: DocumentType }) {
	return <Badge variant='outline'>{documentTypeLabels[type] || type}</Badge>;
}

function getExpiryDateClass(expiryDate: string): string {
	const now = new Date();
	const expiry = new Date(expiryDate);
	const diffDays = Math.ceil(
		(expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
	);

	if (diffDays < 0) return 'text-red-600 font-medium';
	if (diffDays < 7) return 'text-orange-600 font-medium';
	return 'text-muted-foreground';
}

function isExpired(expiryDate: string): boolean {
	return new Date(expiryDate) < new Date();
}

// ==================== Pending Review Table Columns ====================

function PendingActionCell({
	document,
	onReview,
}: {
	document: DriverDocument;
	onReview: (doc: DriverDocument, action: 'approve' | 'reject') => void;
}) {
	return (
		<div className='flex items-center gap-2'>
			<Button
				size='sm'
				className='bg-green-600 text-white hover:bg-green-700'
				onClick={() => onReview(document, 'approve')}
			>
				<IconCheck className='mr-1 h-3.5 w-3.5' />
				Approve
			</Button>
			<Button
				size='sm'
				variant='destructive'
				onClick={() => onReview(document, 'reject')}
			>
				<IconX className='mr-1 h-3.5 w-3.5' />
				Reject
			</Button>
		</div>
	);
}

function createPendingColumns(
	onReview: (doc: DriverDocument, action: 'approve' | 'reject') => void,
): ColumnDef<DriverDocument>[] {
	return [
		{
			accessorKey: 'driver_name',
			header: 'Driver Name',
			cell: ({ row }) => (
				<div className='text-sm font-medium'>
					{row.original.driver_name || (
						<span className='text-muted-foreground'>Unknown</span>
					)}
				</div>
			),
		},
		{
			accessorKey: 'type',
			header: 'Document Type',
			cell: ({ row }) => <DocumentTypeBadge type={row.original.type} />,
		},
		{
			accessorKey: 'submitted_at',
			header: 'Submitted At',
			cell: ({ row }) => (
				<div className='text-sm text-muted-foreground'>
					{formatDateTime(row.original.submitted_at)}
				</div>
			),
		},
		{
			accessorKey: 'expiry_date',
			header: 'Expiry Date',
			cell: ({ row }) => {
				const expiry = row.original.expiry_date;
				if (!expiry)
					return (
						<span className='text-sm text-muted-foreground'>
							N/A
						</span>
					);
				return (
					<div className={`text-sm ${getExpiryDateClass(expiry)}`}>
						{formatDate(expiry)}
					</div>
				);
			},
		},
		{
			id: 'actions',
			header: 'Actions',
			cell: ({ row }) => (
				<PendingActionCell
					document={row.original}
					onReview={onReview}
				/>
			),
		},
	];
}

// ==================== Expiring Table Columns ====================

function createExpiringColumns(): ColumnDef<DriverDocument>[] {
	return [
		{
			accessorKey: 'driver_name',
			header: 'Driver Name',
			cell: ({ row }) => (
				<div className='text-sm font-medium'>
					{row.original.driver_name || (
						<span className='text-muted-foreground'>Unknown</span>
					)}
				</div>
			),
		},
		{
			accessorKey: 'type',
			header: 'Document Type',
			cell: ({ row }) => <DocumentTypeBadge type={row.original.type} />,
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => {
				const expiry = row.original.expiry_date;
				if (expiry && isExpired(expiry)) {
					return <Badge variant='destructive'>Expired</Badge>;
				}
				return <StatusBadge status={row.original.status} />;
			},
		},
		{
			accessorKey: 'expiry_date',
			header: 'Expiry Date',
			cell: ({ row }) => {
				const expiry = row.original.expiry_date;
				if (!expiry)
					return (
						<span className='text-sm text-muted-foreground'>
							N/A
						</span>
					);
				return (
					<div className={`text-sm ${getExpiryDateClass(expiry)}`}>
						{formatDate(expiry)}
						{isExpired(expiry) && (
							<span className='ml-1 text-xs text-red-500'>
								(expired)
							</span>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: 'submitted_at',
			header: 'Submitted At',
			cell: ({ row }) => (
				<div className='text-sm text-muted-foreground'>
					{formatDateTime(row.original.submitted_at)}
				</div>
			),
		},
	];
}

// ==================== All Documents Table Columns ====================

function AllDocsActionCell({
	document,
	onReview,
}: {
	document: DriverDocument;
	onReview: (doc: DriverDocument, action: 'approve' | 'reject') => void;
}) {
	if (document.status !== 'pending') {
		return <span className='text-sm text-muted-foreground'>-</span>;
	}

	return (
		<div className='flex items-center gap-2'>
			<Button
				size='sm'
				variant='outline'
				className='h-7 text-green-600 border-green-300 hover:bg-green-50'
				onClick={() => onReview(document, 'approve')}
			>
				<IconCheck className='h-3.5 w-3.5' />
			</Button>
			<Button
				size='sm'
				variant='outline'
				className='h-7 text-red-600 border-red-300 hover:bg-red-50'
				onClick={() => onReview(document, 'reject')}
			>
				<IconX className='h-3.5 w-3.5' />
			</Button>
		</div>
	);
}

function createAllDocsColumns(
	onReview: (doc: DriverDocument, action: 'approve' | 'reject') => void,
): ColumnDef<DriverDocument>[] {
	return [
		{
			accessorKey: 'driver_name',
			header: 'Driver Name',
			cell: ({ row }) => (
				<div className='text-sm font-medium'>
					{row.original.driver_name || (
						<span className='text-muted-foreground'>Unknown</span>
					)}
				</div>
			),
		},
		{
			accessorKey: 'type',
			header: 'Type',
			cell: ({ row }) => (
				<div className='text-sm'>
					{documentTypeLabels[row.original.type] || row.original.type}
				</div>
			),
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => <StatusBadge status={row.original.status} />,
		},
		{
			accessorKey: 'expiry_date',
			header: 'Expiry Date',
			cell: ({ row }) => {
				const expiry = row.original.expiry_date;
				if (!expiry)
					return (
						<span className='text-sm text-muted-foreground'>
							N/A
						</span>
					);
				return (
					<div className={`text-sm ${getExpiryDateClass(expiry)}`}>
						{formatDate(expiry)}
					</div>
				);
			},
		},
		{
			accessorKey: 'submitted_at',
			header: 'Submitted At',
			cell: ({ row }) => (
				<div className='text-sm text-muted-foreground'>
					{formatDate(row.original.submitted_at)}
				</div>
			),
		},
		{
			accessorKey: 'reviewed_by',
			header: 'Reviewed By',
			cell: ({ row }) => (
				<div className='text-sm text-muted-foreground'>
					{row.original.reviewed_by || '-'}
				</div>
			),
		},
		{
			accessorKey: 'reviewed_at',
			header: 'Reviewed At',
			cell: ({ row }) => (
				<div className='text-sm text-muted-foreground'>
					{row.original.reviewed_at
						? formatDateTime(row.original.reviewed_at)
						: '-'}
				</div>
			),
		},
		{
			id: 'actions',
			header: 'Actions',
			cell: ({ row }) => (
				<AllDocsActionCell
					document={row.original}
					onReview={onReview}
				/>
			),
		},
	];
}

// ==================== Main Page Component ====================

export default function DocumentsPage() {
	const [activeTab, setActiveTab] = useState('pending');

	// Pending review state
	const [pendingDocs, setPendingDocs] = useState<DriverDocument[]>([]);
	const [isLoadingPending, setIsLoadingPending] = useState(true);
	const [pendingPagination, setPendingPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});
	const [pendingSorting, setPendingSorting] = useState<SortingState>([]);

	// Expiring state
	const [expiringDocs, setExpiringDocs] = useState<DriverDocument[]>([]);
	const [isLoadingExpiring, setIsLoadingExpiring] = useState(true);
	const [expiringDays, setExpiringDays] = useState('30');
	const [expiringPagination, setExpiringPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});
	const [expiringSorting, setExpiringSorting] = useState<SortingState>([]);

	// All documents state
	const [allDocs, setAllDocs] = useState<DriverDocument[]>([]);
	const [isLoadingAll, setIsLoadingAll] = useState(true);
	const [allPagination, setAllPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});
	const [allSorting, setAllSorting] = useState<SortingState>([]);
	const [allStatusFilter, setAllStatusFilter] = useState<string>('all');
	const [allTypeFilter, setAllTypeFilter] = useState<string>('all');

	// Stats
	const [statsPendingCount, setStatsPendingCount] = useState(0);
	const [statsExpiringCount, setStatsExpiringCount] = useState(0);
	const [statsTotalCount, setStatsTotalCount] = useState(0);
	const [isLoadingStats, setIsLoadingStats] = useState(true);

	// Review dialog state
	const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
	const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>(
		'approve',
	);
	const [reviewDocument, setReviewDocument] = useState<DriverDocument | null>(
		null,
	);
	const [rejectionReason, setRejectionReason] = useState('');
	const [isSubmittingReview, setIsSubmittingReview] = useState(false);

	// ==================== Data Fetching ====================

	const fetchStats = useCallback(async () => {
		try {
			setIsLoadingStats(true);
			const [pendingRes, expiringRes, allRes] = await Promise.all([
				documentsService.getPending({ limit: 1 }),
				documentsService.getExpiring({ limit: 1, days: 30 }),
				documentsService.getDocuments({ limit: 1 }),
			]);
			setStatsPendingCount(pendingRes.meta.total);
			setStatsExpiringCount(expiringRes.meta.total);
			setStatsTotalCount(allRes.meta.total);
		} catch (error) {
			console.error('Failed to fetch document stats:', error);
		} finally {
			setIsLoadingStats(false);
		}
	}, []);

	const fetchPendingDocs = useCallback(async () => {
		try {
			setIsLoadingPending(true);
			const response = await documentsService.getPending({
				limit: pendingPagination.limit,
				offset: pendingPagination.offset,
			});
			setPendingDocs(response.data);
			setPendingPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to load pending documents';
			toast.error('Failed to load pending documents', {
				description: errorMessage,
			});
		} finally {
			setIsLoadingPending(false);
		}
	}, [pendingPagination.limit, pendingPagination.offset]);

	const fetchExpiringDocs = useCallback(async () => {
		try {
			setIsLoadingExpiring(true);
			const days = parseInt(expiringDays) || 30;
			const response = await documentsService.getExpiring({
				limit: expiringPagination.limit,
				offset: expiringPagination.offset,
				days,
			});
			setExpiringDocs(response.data);
			setExpiringPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to load expiring documents';
			toast.error('Failed to load expiring documents', {
				description: errorMessage,
			});
		} finally {
			setIsLoadingExpiring(false);
		}
	}, [expiringPagination.limit, expiringPagination.offset, expiringDays]);

	const fetchAllDocs = useCallback(async () => {
		try {
			setIsLoadingAll(true);
			const params: Record<string, string | number> = {
				limit: allPagination.limit,
				offset: allPagination.offset,
			};
			if (allStatusFilter !== 'all') {
				params.status = allStatusFilter;
			}
			if (allTypeFilter !== 'all') {
				params.type = allTypeFilter;
			}
			const response = await documentsService.getDocuments(params);
			setAllDocs(response.data);
			setAllPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to load documents';
			toast.error('Failed to load documents', {
				description: errorMessage,
			});
		} finally {
			setIsLoadingAll(false);
		}
	}, [
		allPagination.limit,
		allPagination.offset,
		allStatusFilter,
		allTypeFilter,
	]);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	useEffect(() => {
		fetchPendingDocs();
	}, [fetchPendingDocs]);

	useEffect(() => {
		fetchExpiringDocs();
	}, [fetchExpiringDocs]);

	useEffect(() => {
		fetchAllDocs();
	}, [fetchAllDocs]);

	// ==================== Review Actions ====================

	const handleOpenReview = useCallback(
		(doc: DriverDocument, action: 'approve' | 'reject') => {
			setReviewDocument(doc);
			setReviewAction(action);
			setRejectionReason('');
			setReviewDialogOpen(true);
		},
		[],
	);

	const handleSubmitReview = async () => {
		if (!reviewDocument) return;

		if (reviewAction === 'reject' && !rejectionReason.trim()) {
			toast.error('Please provide a reason for rejection');
			return;
		}

		try {
			setIsSubmittingReview(true);
			const data: ReviewDocumentRequest = {
				status: reviewAction === 'approve' ? 'approved' : 'rejected',
			};
			if (reviewAction === 'reject') {
				data.rejection_reason = rejectionReason;
			}

			await documentsService.reviewDocument(reviewDocument.id, data);
			toast.success(
				reviewAction === 'approve'
					? 'Document approved successfully'
					: 'Document rejected',
				{
					description: `${documentTypeLabels[reviewDocument.type]} for ${reviewDocument.driver_name || 'Unknown Driver'} has been ${reviewAction === 'approve' ? 'approved' : 'rejected'}.`,
				},
			);
			setReviewDialogOpen(false);
			setReviewDocument(null);
			setRejectionReason('');

			// Refresh data
			fetchPendingDocs();
			fetchAllDocs();
			fetchStats();
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Failed to review document';
			toast.error('Failed to review document', {
				description: errorMessage,
			});
		} finally {
			setIsSubmittingReview(false);
		}
	};

	const handleRefresh = () => {
		if (activeTab === 'pending') {
			fetchPendingDocs();
		} else if (activeTab === 'expiring') {
			fetchExpiringDocs();
		} else {
			fetchAllDocs();
		}
		fetchStats();
		toast.success('Documents refreshed');
	};

	// ==================== Tables ====================

	const pendingColumns = useMemo(
		() => createPendingColumns(handleOpenReview),
		[handleOpenReview],
	);
	const expiringColumns = useMemo(() => createExpiringColumns(), []);
	const allDocsColumns = useMemo(
		() => createAllDocsColumns(handleOpenReview),
		[handleOpenReview],
	);

	const pendingTable = useReactTable({
		data: pendingDocs,
		columns: pendingColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setPendingSorting,
		state: { sorting: pendingSorting },
	});

	const expiringTable = useReactTable({
		data: expiringDocs,
		columns: expiringColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setExpiringSorting,
		state: { sorting: expiringSorting },
	});

	const allDocsTable = useReactTable({
		data: allDocs,
		columns: allDocsColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setAllSorting,
		state: { sorting: allSorting },
	});

	// Pagination helpers
	const pendingTotalPages = Math.ceil(
		pendingPagination.total / pendingPagination.limit,
	);
	const pendingCurrentPage =
		Math.floor(pendingPagination.offset / pendingPagination.limit) + 1;

	const expiringTotalPages = Math.ceil(
		expiringPagination.total / expiringPagination.limit,
	);
	const expiringCurrentPage =
		Math.floor(expiringPagination.offset / expiringPagination.limit) + 1;

	const allTotalPages = Math.ceil(allPagination.total / allPagination.limit);
	const allCurrentPage =
		Math.floor(allPagination.offset / allPagination.limit) + 1;

	// ==================== Shared Table Renderer ====================

	function renderTable(
		table: ReturnType<typeof useReactTable<DriverDocument>>,
		isLoading: boolean,
		emptyMessage: string,
	) {
		if (isLoading) {
			return (
				<div className='space-y-2'>
					{[...Array(5)].map((_, i) => (
						<Skeleton key={i} className='h-16 w-full' />
					))}
				</div>
			);
		}

		if (table.getRowModel().rows.length === 0) {
			return (
				<div className='flex flex-col items-center justify-center py-12 text-center'>
					<IconFileText className='h-12 w-12 text-muted-foreground mb-4' />
					<h3 className='text-lg font-semibold'>
						No documents found
					</h3>
					<p className='text-sm text-muted-foreground'>
						{emptyMessage}
					</p>
				</div>
			);
		}

		return (
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
													header.column.columnDef
														.header,
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
		);
	}

	function renderPagination(
		pagination: { total: number; limit: number; offset: number },
		currentPage: number,
		totalPages: number,
		onPageChange: (newOffset: number) => void,
		label: string,
	) {
		if (totalPages <= 1) return null;

		return (
			<div className='flex items-center justify-between mt-4'>
				<p className='text-sm text-muted-foreground'>
					Showing {pagination.offset + 1} to{' '}
					{Math.min(
						pagination.offset + pagination.limit,
						pagination.total,
					)}{' '}
					of {pagination.total} {label}
				</p>
				<div className='flex items-center gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() =>
							onPageChange(pagination.offset - pagination.limit)
						}
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
						onClick={() =>
							onPageChange(pagination.offset + pagination.limit)
						}
						disabled={currentPage === totalPages}
					>
						Next
					</Button>
				</div>
			</div>
		);
	}

	// ==================== Render ====================

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>
						Driver Documents
					</h1>
					<p className='text-sm text-muted-foreground'>
						Review and manage driver document submissions
					</p>
				</div>
				<Button variant='outline' size='sm' onClick={handleRefresh}>
					<IconRefresh className='h-4 w-4' />
					Refresh
				</Button>
			</div>

			{/* Tabs */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className='space-y-4'
			>
				<TabsList>
					<TabsTrigger value='pending' className='gap-2'>
						Pending Review
						{statsPendingCount > 0 && (
							<Badge variant='destructive'>
								{statsPendingCount}
							</Badge>
						)}
					</TabsTrigger>
					<TabsTrigger value='expiring' className='gap-2'>
						<IconAlertTriangle className='h-4 w-4' />
						Expiring Soon
					</TabsTrigger>
					<TabsTrigger value='all' className='gap-2'>
						All Documents
						<Badge variant='secondary'>{statsTotalCount}</Badge>
					</TabsTrigger>
				</TabsList>

				{/* ==================== Tab 1: Pending Review ==================== */}
				<TabsContent value='pending' className='space-y-4'>
					{/* Stats Cards */}
					<div className='grid gap-4 md:grid-cols-3'>
						<Card className='border-l-4 border-l-yellow-500'>
							<CardHeader className='pb-2'>
								<CardDescription className='flex items-center gap-2'>
									<IconClock className='h-4 w-4 text-yellow-600' />
									Pending Reviews
								</CardDescription>
								{isLoadingStats ? (
									<Skeleton className='h-8 w-20' />
								) : (
									<CardTitle className='text-3xl text-yellow-600'>
										{statsPendingCount}
									</CardTitle>
								)}
							</CardHeader>
							<CardContent>
								<p className='text-xs text-muted-foreground'>
									Documents awaiting review
								</p>
							</CardContent>
						</Card>

						<Card className='border-l-4 border-l-orange-500'>
							<CardHeader className='pb-2'>
								<CardDescription className='flex items-center gap-2'>
									<IconAlertTriangle className='h-4 w-4 text-orange-600' />
									Expiring Soon
								</CardDescription>
								{isLoadingStats ? (
									<Skeleton className='h-8 w-20' />
								) : (
									<CardTitle className='text-3xl text-orange-600'>
										{statsExpiringCount}
									</CardTitle>
								)}
							</CardHeader>
							<CardContent>
								<p className='text-xs text-muted-foreground'>
									Expiring in the next 30 days
								</p>
							</CardContent>
						</Card>

						<Card className='border-l-4 border-l-blue-500'>
							<CardHeader className='pb-2'>
								<CardDescription className='flex items-center gap-2'>
									<IconFileText className='h-4 w-4 text-blue-600' />
									Total Documents
								</CardDescription>
								{isLoadingStats ? (
									<Skeleton className='h-8 w-20' />
								) : (
									<CardTitle className='text-3xl text-blue-600'>
										{statsTotalCount}
									</CardTitle>
								)}
							</CardHeader>
							<CardContent>
								<p className='text-xs text-muted-foreground'>
									All submitted documents
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Pending Documents Table */}
					<Card>
						<CardHeader>
							<CardTitle>Pending Documents</CardTitle>
							<CardDescription>
								{isLoadingPending
									? 'Loading pending documents...'
									: `${pendingPagination.total} documents awaiting review`}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{renderTable(
								pendingTable,
								isLoadingPending,
								'No documents pending review.',
							)}
							{renderPagination(
								pendingPagination,
								pendingCurrentPage,
								pendingTotalPages,
								(offset) =>
									setPendingPagination((prev) => ({
										...prev,
										offset,
									})),
								'documents',
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ==================== Tab 2: Expiring Soon ==================== */}
				<TabsContent value='expiring' className='space-y-4'>
					<Card>
						<CardHeader>
							<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
								<div>
									<CardTitle>Expiring Documents</CardTitle>
									<CardDescription>
										{isLoadingExpiring
											? 'Loading expiring documents...'
											: `${expiringPagination.total} documents expiring within ${expiringDays} days`}
									</CardDescription>
								</div>
								<div className='flex items-center gap-2'>
									<Label
										htmlFor='expiring-days'
										className='text-sm whitespace-nowrap'
									>
										Days until expiry:
									</Label>
									<Input
										id='expiring-days'
										type='number'
										min='1'
										max='365'
										value={expiringDays}
										onChange={(e) => {
											setExpiringDays(e.target.value);
											setExpiringPagination((prev) => ({
												...prev,
												offset: 0,
											}));
										}}
										className='w-20'
									/>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{renderTable(
								expiringTable,
								isLoadingExpiring,
								'No expiring documents found.',
							)}
							{renderPagination(
								expiringPagination,
								expiringCurrentPage,
								expiringTotalPages,
								(offset) =>
									setExpiringPagination((prev) => ({
										...prev,
										offset,
									})),
								'documents',
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ==================== Tab 3: All Documents ==================== */}
				<TabsContent value='all' className='space-y-4'>
					<Card>
						<CardHeader>
							<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
								<div>
									<CardTitle>All Documents</CardTitle>
									<CardDescription>
										{isLoadingAll
											? 'Loading documents...'
											: `Showing ${allDocs.length} of ${allPagination.total} documents`}
									</CardDescription>
								</div>
								<div className='flex items-center gap-2'>
									<Select
										value={allStatusFilter}
										onValueChange={(value) => {
											setAllStatusFilter(value);
											setAllPagination((prev) => ({
												...prev,
												offset: 0,
											}));
										}}
									>
										<SelectTrigger className='w-37.5'>
											<SelectValue placeholder='Status' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>
												All Statuses
											</SelectItem>
											<SelectItem value='pending'>
												Pending
											</SelectItem>
											<SelectItem value='approved'>
												Approved
											</SelectItem>
											<SelectItem value='rejected'>
												Rejected
											</SelectItem>
											<SelectItem value='expired'>
												Expired
											</SelectItem>
										</SelectContent>
									</Select>
									<Select
										value={allTypeFilter}
										onValueChange={(value) => {
											setAllTypeFilter(value);
											setAllPagination((prev) => ({
												...prev,
												offset: 0,
											}));
										}}
									>
										<SelectTrigger className='w-47.5'>
											<SelectValue placeholder='Document Type' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>
												All Types
											</SelectItem>
											<SelectItem value='drivers_license'>
												Driver&apos;s License
											</SelectItem>
											<SelectItem value='vehicle_registration'>
												Vehicle Registration
											</SelectItem>
											<SelectItem value='insurance'>
												Insurance
											</SelectItem>
											<SelectItem value='background_check'>
												Background Check
											</SelectItem>
											<SelectItem value='profile_photo'>
												Profile Photo
											</SelectItem>
											<SelectItem value='vehicle_photo'>
												Vehicle Photo
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{renderTable(
								allDocsTable,
								isLoadingAll,
								'No documents match your current filters.',
							)}
							{renderPagination(
								allPagination,
								allCurrentPage,
								allTotalPages,
								(offset) =>
									setAllPagination((prev) => ({
										...prev,
										offset,
									})),
								'documents',
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* ==================== Review Dialog ==================== */}
			<Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2'>
							{reviewAction === 'approve' ? (
								<>
									<IconCheck className='h-5 w-5 text-green-600' />
									Approve Document
								</>
							) : (
								<>
									<IconX className='h-5 w-5 text-destructive' />
									Reject Document
								</>
							)}
						</DialogTitle>
						<DialogDescription>
							{reviewAction === 'approve'
								? 'Confirm approval of this document.'
								: 'Provide a reason for rejecting this document.'}
						</DialogDescription>
					</DialogHeader>

					{reviewDocument && (
						<div className='space-y-4'>
							{/* Document Info */}
							<div className='rounded-lg border p-4 space-y-3'>
								<div className='flex items-center justify-between'>
									<span className='text-sm text-muted-foreground'>
										Document Type
									</span>
									<DocumentTypeBadge
										type={reviewDocument.type}
									/>
								</div>
								<div className='flex items-center justify-between'>
									<span className='text-sm text-muted-foreground'>
										Driver
									</span>
									<span className='text-sm font-medium'>
										{reviewDocument.driver_name ||
											'Unknown'}
									</span>
								</div>
								<div className='flex items-center justify-between'>
									<span className='text-sm text-muted-foreground'>
										File
									</span>
									<a
										href={reviewDocument.file_url}
										target='_blank'
										rel='noopener noreferrer'
										className='text-sm text-blue-600 hover:underline flex items-center gap-1'
									>
										View Document
										<IconExternalLink className='h-3.5 w-3.5' />
									</a>
								</div>
								{reviewDocument.expiry_date && (
									<div className='flex items-center justify-between'>
										<span className='text-sm text-muted-foreground'>
											Expiry Date
										</span>
										<span
											className={`text-sm ${getExpiryDateClass(reviewDocument.expiry_date)}`}
										>
											{formatDate(
												reviewDocument.expiry_date,
											)}
										</span>
									</div>
								)}
							</div>

							{/* Rejection Reason (only for reject) */}
							{reviewAction === 'reject' && (
								<div className='space-y-2'>
									<Label htmlFor='rejection-reason'>
										Reason for Rejection
									</Label>
									<Textarea
										id='rejection-reason'
										placeholder='Enter the reason for rejecting this document...'
										value={rejectionReason}
										onChange={(e) =>
											setRejectionReason(e.target.value)
										}
										rows={3}
									/>
								</div>
							)}
						</div>
					)}

					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setReviewDialogOpen(false)}
							disabled={isSubmittingReview}
						>
							Cancel
						</Button>
						{reviewAction === 'approve' ? (
							<Button
								onClick={handleSubmitReview}
								disabled={isSubmittingReview}
								className='bg-green-600 text-white hover:bg-green-700'
							>
								{isSubmittingReview
									? 'Approving...'
									: 'Approve Document'}
							</Button>
						) : (
							<Button
								variant='destructive'
								onClick={handleSubmitReview}
								disabled={
									isSubmittingReview ||
									!rejectionReason.trim()
								}
							>
								{isSubmittingReview
									? 'Rejecting...'
									: 'Reject Document'}
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
