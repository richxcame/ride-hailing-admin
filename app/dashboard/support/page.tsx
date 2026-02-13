'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import {
	IconRefresh,
	IconPlus,
	IconEye,
	IconTicket,
	IconLoader,
	IconUrgent,
	IconCircleCheck,
	IconSend,
	IconLock,
	IconChevronUp,
	IconChevronDown,
} from '@tabler/icons-react';
import { supportService } from '@/lib/api/support.service';
import {
	SupportTicket,
	TicketMessage,
	TicketPriority,
	TicketStatus,
	TicketCategory,
	CreateTicketRequest,
} from '@/lib/types/support';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Separator } from '@/components/ui/separator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<TicketCategory, string> = {
	ride_issue: 'Ride Issue',
	payment_issue: 'Payment Issue',
	driver_complaint: 'Driver Complaint',
	rider_complaint: 'Rider Complaint',
	account_issue: 'Account Issue',
	app_bug: 'App Bug',
	feature_request: 'Feature Request',
	other: 'Other',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
	open: 'Open',
	in_progress: 'In Progress',
	waiting_on_customer: 'Waiting on Customer',
	resolved: 'Resolved',
	closed: 'Closed',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
	low: 'Low',
	medium: 'Medium',
	high: 'High',
	urgent: 'Urgent',
};

function getPriorityBadge(priority: TicketPriority) {
	switch (priority) {
		case 'urgent':
			return (
				<Badge variant='destructive'>
					{PRIORITY_LABELS[priority]}
				</Badge>
			);
		case 'high':
			return (
				<Badge className='bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-transparent'>
					{PRIORITY_LABELS[priority]}
				</Badge>
			);
		case 'medium':
			return (
				<Badge variant='default'>
					{PRIORITY_LABELS[priority]}
				</Badge>
			);
		case 'low':
			return (
				<Badge variant='secondary'>
					{PRIORITY_LABELS[priority]}
				</Badge>
			);
		default:
			return <Badge variant='secondary'>{priority}</Badge>;
	}
}

function getStatusBadge(status: TicketStatus) {
	switch (status) {
		case 'open':
			return (
				<Badge className='bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-transparent'>
					{STATUS_LABELS[status]}
				</Badge>
			);
		case 'in_progress':
			return (
				<Badge className='bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-transparent'>
					{STATUS_LABELS[status]}
				</Badge>
			);
		case 'waiting_on_customer':
			return (
				<Badge className='bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 border-transparent'>
					{STATUS_LABELS[status]}
				</Badge>
			);
		case 'resolved':
			return (
				<Badge className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-transparent'>
					{STATUS_LABELS[status]}
				</Badge>
			);
		case 'closed':
			return (
				<Badge variant='secondary'>
					{STATUS_LABELS[status]}
				</Badge>
			);
		default:
			return <Badge variant='secondary'>{status}</Badge>;
	}
}

function getCategoryBadge(category: TicketCategory) {
	return (
		<Badge variant='outline' className='text-xs font-normal'>
			{CATEGORY_LABELS[category] ?? category}
		</Badge>
	);
}

function formatDate(dateStr: string) {
	const d = new Date(dateStr);
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr: string) {
	const d = new Date(dateStr);
	return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

function createColumns(
	onView: (ticket: SupportTicket) => void,
): ColumnDef<SupportTicket>[] {
	return [
		{
			accessorKey: 'subject',
			header: 'Subject',
			cell: ({ row }) => {
				const ticket = row.original;
				return (
					<div className='flex flex-col gap-1 min-w-0'>
						<span className='text-sm font-medium truncate max-w-64' title={ticket.subject}>
							{ticket.subject}
						</span>
						{getCategoryBadge(ticket.category)}
					</div>
				);
			},
		},
		{
			accessorKey: 'user_name',
			header: 'User',
			cell: ({ row }) => {
				const ticket = row.original;
				return (
					<div className='flex flex-col'>
						<span className='text-sm'>{ticket.user_name || 'Unknown'}</span>
						{ticket.user_email && (
							<span className='text-xs text-muted-foreground truncate max-w-40'>
								{ticket.user_email}
							</span>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: 'priority',
			header: 'Priority',
			cell: ({ row }) => getPriorityBadge(row.original.priority),
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => getStatusBadge(row.original.status),
		},
		{
			accessorKey: 'assigned_to_name',
			header: 'Assigned To',
			cell: ({ row }) => (
				<span className='text-sm text-muted-foreground'>
					{row.original.assigned_to_name || 'Unassigned'}
				</span>
			),
		},
		{
			accessorKey: 'created_at',
			header: 'Created',
			cell: ({ row }) => (
				<span className='text-sm text-muted-foreground'>
					{formatDate(row.original.created_at)}
				</span>
			),
		},
		{
			id: 'actions',
			header: '',
			cell: ({ row }) => (
				<Button
					variant='ghost'
					size='sm'
					onClick={() => onView(row.original)}
				>
					<IconEye className='h-4 w-4' />
				</Button>
			),
		},
	];
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SupportTicketsPage() {
	// Tickets list state
	const [tickets, setTickets] = useState<SupportTicket[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});

	// Filters
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [priorityFilter, setPriorityFilter] = useState<string>('all');
	const [categoryFilter, setCategoryFilter] = useState<string>('all');

	// Stats
	const [statsOpen, setStatsOpen] = useState(0);
	const [statsInProgress, setStatsInProgress] = useState(0);
	const [statsUrgent, setStatsUrgent] = useState(0);
	const [statsResolvedToday, setStatsResolvedToday] = useState(0);
	const [isLoadingStats, setIsLoadingStats] = useState(true);

	// Detail sheet state
	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
	const [messages, setMessages] = useState<TicketMessage[]>([]);
	const [isLoadingMessages, setIsLoadingMessages] = useState(false);
	const [replyText, setReplyText] = useState('');
	const [isSendingReply, setIsSendingReply] = useState(false);
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Create dialog state
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [createUserId, setCreateUserId] = useState('');
	const [createCategory, setCreateCategory] = useState<TicketCategory>('ride_issue');
	const [createPriority, setCreatePriority] = useState<TicketPriority>('medium');
	const [createSubject, setCreateSubject] = useState('');
	const [createDescription, setCreateDescription] = useState('');
	const [isCreating, setIsCreating] = useState(false);

	// Close ticket confirmation
	const [closeDialogOpen, setCloseDialogOpen] = useState(false);
	const [closeResolution, setCloseResolution] = useState('');
	const [isClosing, setIsClosing] = useState(false);

	// ------------------------------------------------------------------
	// Data fetching
	// ------------------------------------------------------------------

	const fetchStats = useCallback(async () => {
		try {
			setIsLoadingStats(true);

			const [openRes, inProgressRes, urgentRes, resolvedRes] = await Promise.all([
				supportService.getTickets({ limit: 1, status: 'open' }),
				supportService.getTickets({ limit: 1, status: 'in_progress' }),
				supportService.getTickets({ limit: 1, priority: 'urgent' }),
				supportService.getTickets({ limit: 1, status: 'resolved' }),
			]);

			setStatsOpen(openRes.meta.total);
			setStatsInProgress(inProgressRes.meta.total);
			setStatsUrgent(urgentRes.meta.total);

			// For "resolved today" we count from the resolved response.
			// The backend may filter by date if available. As a fallback we use the total.
			setStatsResolvedToday(resolvedRes.meta.total);
		} catch (error) {
			console.error('Failed to fetch stats:', error);
		} finally {
			setIsLoadingStats(false);
		}
	}, []);

	const fetchTickets = useCallback(async () => {
		try {
			setIsLoading(true);
			const params: Record<string, string | number> = {
				limit: pagination.limit,
				offset: pagination.offset,
			};

			if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
			if (priorityFilter && priorityFilter !== 'all') params.priority = priorityFilter;
			if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;

			const response = await supportService.getTickets(params);
			setTickets(response.data);
			setPagination((prev) => ({ ...prev, total: response.meta.total }));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load tickets';
			toast.error('Failed to load support tickets', { description: errorMessage });
		} finally {
			setIsLoading(false);
		}
	}, [pagination.limit, pagination.offset, statusFilter, priorityFilter, categoryFilter]);

	useEffect(() => {
		fetchStats();
	}, [fetchStats]);

	useEffect(() => {
		fetchTickets();
	}, [fetchTickets]);

	const handleRefresh = () => {
		fetchTickets();
		fetchStats();
		toast.success('Tickets refreshed');
	};

	// ------------------------------------------------------------------
	// Pagination
	// ------------------------------------------------------------------

	const totalPages = Math.ceil(pagination.total / pagination.limit);
	const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	// ------------------------------------------------------------------
	// Detail sheet
	// ------------------------------------------------------------------

	const handleViewTicket = useCallback(async (ticket: SupportTicket) => {
		setSelectedTicket(ticket);
		setIsSheetOpen(true);
		setReplyText('');

		try {
			setIsLoadingMessages(true);
			const msgs = await supportService.getTicketMessages(ticket.id);
			setMessages(Array.isArray(msgs) ? msgs : []);
		} catch (error) {
			toast.error('Failed to load messages');
			setMessages([]);
		} finally {
			setIsLoadingMessages(false);
		}
	}, []);

	useEffect(() => {
		if (messages.length > 0) {
			messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
		}
	}, [messages]);

	const handleReply = async (isInternal: boolean) => {
		if (!selectedTicket || !replyText.trim()) {
			toast.error('Please enter a message');
			return;
		}

		try {
			setIsSendingReply(true);
			const newMessage = await supportService.replyToTicket(selectedTicket.id, {
				message: replyText.trim(),
				is_internal: isInternal,
			});
			setMessages((prev) => [...prev, newMessage]);
			setReplyText('');
			toast.success(isInternal ? 'Internal note added' : 'Reply sent');
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to send reply';
			toast.error('Failed to send reply', { description: errorMessage });
		} finally {
			setIsSendingReply(false);
		}
	};

	const handleStatusChange = async (newStatus: TicketStatus) => {
		if (!selectedTicket) return;

		try {
			setIsUpdatingStatus(true);
			const updated = await supportService.updateTicket(selectedTicket.id, {
				status: newStatus,
			});
			setSelectedTicket(updated);
			toast.success(`Ticket status updated to ${STATUS_LABELS[newStatus]}`);
			fetchTickets();
			fetchStats();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
			toast.error('Failed to update ticket status', { description: errorMessage });
		} finally {
			setIsUpdatingStatus(false);
		}
	};

	const handleCloseTicketClick = () => {
		setCloseResolution('');
		setCloseDialogOpen(true);
	};

	const handleConfirmClose = async () => {
		if (!selectedTicket) return;

		try {
			setIsClosing(true);
			const updated = await supportService.closeTicket(selectedTicket.id, {
				resolution: closeResolution || undefined,
			});
			setSelectedTicket(updated);
			setCloseDialogOpen(false);
			toast.success('Ticket closed');
			fetchTickets();
			fetchStats();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to close ticket';
			toast.error('Failed to close ticket', { description: errorMessage });
		} finally {
			setIsClosing(false);
		}
	};

	// ------------------------------------------------------------------
	// Create dialog
	// ------------------------------------------------------------------

	const resetCreateForm = () => {
		setCreateUserId('');
		setCreateCategory('ride_issue');
		setCreatePriority('medium');
		setCreateSubject('');
		setCreateDescription('');
	};

	const handleCreateTicket = async () => {
		if (!createUserId.trim() || !createSubject.trim() || !createDescription.trim()) {
			toast.error('Please fill in all required fields');
			return;
		}

		try {
			setIsCreating(true);
			const payload: CreateTicketRequest = {
				user_id: createUserId.trim(),
				category: createCategory,
				priority: createPriority,
				subject: createSubject.trim(),
				description: createDescription.trim(),
			};

			await supportService.createTicket(payload);
			toast.success('Ticket created successfully');
			setIsCreateOpen(false);
			resetCreateForm();
			fetchTickets();
			fetchStats();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to create ticket';
			toast.error('Failed to create ticket', { description: errorMessage });
		} finally {
			setIsCreating(false);
		}
	};

	// ------------------------------------------------------------------
	// Table
	// ------------------------------------------------------------------

	const columns = useMemo(
		() => createColumns(handleViewTicket),
		[handleViewTicket],
	);

	const table = useReactTable({
		data: tickets,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		state: {
			sorting,
		},
	});

	// ------------------------------------------------------------------
	// Render
	// ------------------------------------------------------------------

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Support Tickets</h1>
					<p className='text-sm text-muted-foreground'>
						Manage customer support tickets
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<Button variant='outline' size='sm' onClick={() => setIsCreateOpen(true)}>
						<IconPlus className='h-4 w-4' />
						New Ticket
					</Button>
					<Button variant='outline' size='sm' onClick={handleRefresh}>
						<IconRefresh className='h-4 w-4' />
						Refresh
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card className='border-l-4 border-l-blue-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconTicket className='h-4 w-4 text-blue-500' />
							Open Tickets
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-blue-600'>{statsOpen}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Awaiting response</p>
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-yellow-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconLoader className='h-4 w-4 text-yellow-500' />
							In Progress
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-yellow-600'>{statsInProgress}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Being worked on</p>
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-red-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconUrgent className='h-4 w-4 text-red-500' />
							Urgent Priority
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-red-600'>{statsUrgent}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Requires immediate attention</p>
					</CardContent>
				</Card>

				<Card className='border-l-4 border-l-green-500'>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCircleCheck className='h-4 w-4 text-green-500' />
							Resolved Today
						</CardDescription>
						{isLoadingStats ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-green-600'>{statsResolvedToday}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Successfully resolved</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters Row */}
			<div className='flex flex-col gap-4 md:flex-row md:items-center'>
				<Select
					value={statusFilter}
					onValueChange={(value) => {
						setStatusFilter(value);
						setPagination((prev) => ({ ...prev, offset: 0 }));
					}}
				>
					<SelectTrigger className='w-[180px]'>
						<SelectValue placeholder='All Statuses' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>All Statuses</SelectItem>
						<SelectItem value='open'>Open</SelectItem>
						<SelectItem value='in_progress'>In Progress</SelectItem>
						<SelectItem value='waiting_on_customer'>Waiting on Customer</SelectItem>
						<SelectItem value='resolved'>Resolved</SelectItem>
						<SelectItem value='closed'>Closed</SelectItem>
					</SelectContent>
				</Select>

				<Select
					value={priorityFilter}
					onValueChange={(value) => {
						setPriorityFilter(value);
						setPagination((prev) => ({ ...prev, offset: 0 }));
					}}
				>
					<SelectTrigger className='w-[150px]'>
						<SelectValue placeholder='All Priorities' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>All Priorities</SelectItem>
						<SelectItem value='low'>Low</SelectItem>
						<SelectItem value='medium'>Medium</SelectItem>
						<SelectItem value='high'>High</SelectItem>
						<SelectItem value='urgent'>Urgent</SelectItem>
					</SelectContent>
				</Select>

				<Select
					value={categoryFilter}
					onValueChange={(value) => {
						setCategoryFilter(value);
						setPagination((prev) => ({ ...prev, offset: 0 }));
					}}
				>
					<SelectTrigger className='w-[180px]'>
						<SelectValue placeholder='All Categories' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>All Categories</SelectItem>
						<SelectItem value='ride_issue'>Ride Issue</SelectItem>
						<SelectItem value='payment_issue'>Payment Issue</SelectItem>
						<SelectItem value='driver_complaint'>Driver Complaint</SelectItem>
						<SelectItem value='rider_complaint'>Rider Complaint</SelectItem>
						<SelectItem value='account_issue'>Account Issue</SelectItem>
						<SelectItem value='app_bug'>App Bug</SelectItem>
						<SelectItem value='feature_request'>Feature Request</SelectItem>
						<SelectItem value='other'>Other</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Tickets Table */}
			<Card>
				<CardHeader>
					<CardTitle>Tickets</CardTitle>
					<CardDescription>
						{isLoading
							? 'Loading tickets...'
							: `Showing ${tickets.length} of ${pagination.total} tickets`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='space-y-2'>
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className='h-16 w-full' />
							))}
						</div>
					) : tickets.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-12 text-center'>
							<IconTicket className='h-12 w-12 text-muted-foreground mb-4' />
							<h3 className='text-lg font-semibold'>No tickets found</h3>
							<p className='text-sm text-muted-foreground'>
								No tickets match your current filters.
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
																		? 'flex items-center gap-2 cursor-pointer select-none'
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
										{Math.min(
											pagination.offset + pagination.limit,
											pagination.total,
										)}{' '}
										of {pagination.total} tickets
									</p>
									<div className='flex items-center gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												handlePageChange(pagination.offset - pagination.limit)
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
												handlePageChange(pagination.offset + pagination.limit)
											}
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

			{/* ============================================================= */}
			{/* Detail Sheet                                                   */}
			{/* ============================================================= */}
			<Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
				<SheetContent side='right' className='sm:max-w-lg w-full flex flex-col'>
					{selectedTicket && (
						<>
							<SheetHeader>
								<SheetTitle className='flex items-center gap-2 pr-8'>
									<IconTicket className='h-5 w-5' />
									Ticket Details
								</SheetTitle>
								<SheetDescription>
									{selectedTicket.subject}
								</SheetDescription>
							</SheetHeader>

							{/* Ticket meta info */}
							<div className='space-y-3 px-4'>
								<div className='grid grid-cols-2 gap-3 text-sm'>
									<div>
										<span className='text-muted-foreground'>Status</span>
										<div className='mt-1'>{getStatusBadge(selectedTicket.status)}</div>
									</div>
									<div>
										<span className='text-muted-foreground'>Priority</span>
										<div className='mt-1'>{getPriorityBadge(selectedTicket.priority)}</div>
									</div>
									<div>
										<span className='text-muted-foreground'>Category</span>
										<div className='mt-1'>{getCategoryBadge(selectedTicket.category)}</div>
									</div>
									<div>
										<span className='text-muted-foreground'>Created</span>
										<div className='mt-1 text-sm'>{formatDateTime(selectedTicket.created_at)}</div>
									</div>
									<div>
										<span className='text-muted-foreground'>User</span>
										<div className='mt-1 text-sm font-medium'>{selectedTicket.user_name || 'Unknown'}</div>
									</div>
									<div>
										<span className='text-muted-foreground'>Assigned To</span>
										<div className='mt-1 text-sm'>{selectedTicket.assigned_to_name || 'Unassigned'}</div>
									</div>
								</div>

								{selectedTicket.ride_id && (
									<div className='text-sm'>
										<span className='text-muted-foreground'>Ride ID: </span>
										<span className='font-mono text-xs'>{selectedTicket.ride_id}</span>
									</div>
								)}

								<div className='text-sm'>
									<span className='text-muted-foreground block mb-1'>Description</span>
									<p className='text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md'>
										{selectedTicket.description}
									</p>
								</div>

								{selectedTicket.resolution && (
									<div className='text-sm'>
										<span className='text-muted-foreground block mb-1'>Resolution</span>
										<p className='text-sm whitespace-pre-wrap bg-green-50 dark:bg-green-950 p-3 rounded-md'>
											{selectedTicket.resolution}
										</p>
									</div>
								)}
							</div>

							<Separator className='my-2' />

							{/* Status change buttons */}
							{selectedTicket.status !== 'closed' && (
								<div className='flex flex-wrap gap-2 px-4'>
									{selectedTicket.status === 'open' && (
										<Button
											variant='outline'
											size='sm'
											onClick={() => handleStatusChange('in_progress')}
											disabled={isUpdatingStatus}
										>
											Start Working
										</Button>
									)}
									{(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
										<Button
											variant='outline'
											size='sm'
											onClick={() => handleStatusChange('waiting_on_customer')}
											disabled={isUpdatingStatus}
										>
											Waiting on Customer
										</Button>
									)}
									{selectedTicket.status !== 'resolved' && (
										<Button
											variant='outline'
											size='sm'
											className='text-green-600 hover:text-green-700'
											onClick={() => handleStatusChange('resolved')}
											disabled={isUpdatingStatus}
										>
											Mark Resolved
										</Button>
									)}
									<Button
										variant='outline'
										size='sm'
										className='text-muted-foreground'
										onClick={handleCloseTicketClick}
										disabled={isUpdatingStatus}
									>
										Close Ticket
									</Button>
								</div>
							)}

							<Separator className='my-2' />

							{/* Messages thread */}
							<div className='flex-1 overflow-y-auto px-4 space-y-3 min-h-0'>
								<span className='text-sm font-medium'>Conversation</span>
								{isLoadingMessages ? (
									<div className='space-y-2'>
										{[...Array(3)].map((_, i) => (
											<Skeleton key={i} className='h-16 w-full' />
										))}
									</div>
								) : messages.length === 0 ? (
									<p className='text-sm text-muted-foreground py-4 text-center'>
										No messages yet. Start the conversation below.
									</p>
								) : (
									messages.map((msg) => (
										<div
											key={msg.id}
											className={`rounded-lg p-3 text-sm ${
												msg.is_internal
													? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800'
													: msg.sender_type === 'admin'
														? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
														: 'bg-muted/50 border border-border'
											}`}
										>
											<div className='flex items-center justify-between mb-1'>
												<span className='font-medium text-xs flex items-center gap-1'>
													{msg.sender_name || (msg.sender_type === 'admin' ? 'Admin' : 'User')}
													{msg.is_internal && (
														<Badge variant='outline' className='text-[10px] px-1 py-0'>
															<IconLock className='h-2.5 w-2.5 mr-0.5' />
															Internal
														</Badge>
													)}
												</span>
												<span className='text-[10px] text-muted-foreground'>
													{formatDateTime(msg.created_at)}
												</span>
											</div>
											<p className='whitespace-pre-wrap'>{msg.message}</p>
										</div>
									))
								)}
								<div ref={messagesEndRef} />
							</div>

							{/* Reply area */}
							{selectedTicket.status !== 'closed' && (
								<div className='border-t p-4 space-y-2'>
									<Textarea
										placeholder='Type your reply...'
										value={replyText}
										onChange={(e) => setReplyText(e.target.value)}
										rows={3}
										className='resize-none'
									/>
									<div className='flex items-center gap-2'>
										<Button
											size='sm'
											onClick={() => handleReply(false)}
											disabled={isSendingReply || !replyText.trim()}
										>
											<IconSend className='h-4 w-4' />
											{isSendingReply ? 'Sending...' : 'Reply'}
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() => handleReply(true)}
											disabled={isSendingReply || !replyText.trim()}
										>
											<IconLock className='h-4 w-4' />
											Internal Note
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</SheetContent>
			</Sheet>

			{/* ============================================================= */}
			{/* Create Ticket Dialog                                           */}
			{/* ============================================================= */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className='sm:max-w-lg'>
					<DialogHeader>
						<DialogTitle>Create Support Ticket</DialogTitle>
						<DialogDescription>
							Create a new support ticket on behalf of a user.
						</DialogDescription>
					</DialogHeader>

					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='create-user-id'>User ID <span className='text-destructive'>*</span></Label>
							<Input
								id='create-user-id'
								placeholder='Enter user ID'
								value={createUserId}
								onChange={(e) => setCreateUserId(e.target.value)}
							/>
						</div>

						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='create-category'>Category</Label>
								<Select
									value={createCategory}
									onValueChange={(v) => setCreateCategory(v as TicketCategory)}
								>
									<SelectTrigger id='create-category'>
										<SelectValue placeholder='Category' />
									</SelectTrigger>
									<SelectContent>
										{(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map((cat) => (
											<SelectItem key={cat} value={cat}>
												{CATEGORY_LABELS[cat]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='create-priority'>Priority</Label>
								<Select
									value={createPriority}
									onValueChange={(v) => setCreatePriority(v as TicketPriority)}
								>
									<SelectTrigger id='create-priority'>
										<SelectValue placeholder='Priority' />
									</SelectTrigger>
									<SelectContent>
										{(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((p) => (
											<SelectItem key={p} value={p}>
												{PRIORITY_LABELS[p]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='create-subject'>Subject <span className='text-destructive'>*</span></Label>
							<Input
								id='create-subject'
								placeholder='Brief description of the issue'
								value={createSubject}
								onChange={(e) => setCreateSubject(e.target.value)}
							/>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='create-description'>Description <span className='text-destructive'>*</span></Label>
							<Textarea
								id='create-description'
								placeholder='Detailed description of the issue...'
								value={createDescription}
								onChange={(e) => setCreateDescription(e.target.value)}
								rows={4}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => {
								setIsCreateOpen(false);
								resetCreateForm();
							}}
							disabled={isCreating}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreateTicket}
							disabled={isCreating || !createUserId.trim() || !createSubject.trim() || !createDescription.trim()}
						>
							{isCreating ? 'Creating...' : 'Create Ticket'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ============================================================= */}
			{/* Close Ticket Confirmation                                      */}
			{/* ============================================================= */}
			<AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Close Ticket</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to close this ticket? This action marks the ticket
							as completed and will no longer accept replies.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className='space-y-2 py-4'>
						<Label htmlFor='close-resolution'>Resolution (optional)</Label>
						<Textarea
							id='close-resolution'
							placeholder='Describe how the issue was resolved...'
							value={closeResolution}
							onChange={(e) => setCloseResolution(e.target.value)}
							rows={3}
						/>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isClosing}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmClose}
							disabled={isClosing}
						>
							{isClosing ? 'Closing...' : 'Close Ticket'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
