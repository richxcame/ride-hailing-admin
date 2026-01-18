'use client';

import * as React from 'react';
import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import {
	IconChevronDown,
	IconChevronUp,
	IconDots,
	IconEye,
	IconAlertTriangle,
	IconShieldCheck,
	IconExternalLink,
} from '@tabler/icons-react';
import { FraudAlert } from '@/lib/types/models';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FraudAlertsTableProps {
	alerts: FraudAlert[];
	isLoading: boolean;
	pagination: {
		total: number;
		limit: number;
		offset: number;
	};
	onPageChange: (offset: number) => void;
	onAlertAction?: (action: 'view' | 'investigate' | 'resolve', alertId: string) => void;
}

const getLevelColor = (level: string) => {
	const colors = {
		low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
		medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
		high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
		critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
	};
	return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getStatusColor = (status: string) => {
	const colors = {
		pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
		investigating: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
		confirmed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
		false_positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
		resolved: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
	};
	return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getAlertTypeLabel = (type: string) => {
	const labels: Record<string, string> = {
		payment_fraud: 'Payment Fraud',
		account_fraud: 'Account Fraud',
		location_fraud: 'Location Fraud',
		ride_fraud: 'Ride Fraud',
		rating_manipulation: 'Rating Manipulation',
		promo_abuse: 'Promo Abuse',
	};
	return labels[type] || type;
};

const getRiskScoreColor = (score: number) => {
	if (score >= 90) return 'text-red-600 font-bold';
	if (score >= 70) return 'text-orange-600 font-semibold';
	if (score >= 50) return 'text-yellow-600';
	return 'text-blue-600';
};

function ActionCell({
	alert,
	onAlertAction,
}: {
	alert: FraudAlert;
	onAlertAction?: (action: 'view' | 'investigate' | 'resolve', alertId: string) => void;
}) {
	const handleViewDetails = () => {
		if (onAlertAction) {
			onAlertAction('view', alert.id);
		}
	};

	const handleInvestigate = () => {
		if (onAlertAction) {
			onAlertAction('investigate', alert.id);
		}
	};

	const handleResolve = () => {
		if (onAlertAction) {
			onAlertAction('resolve', alert.id);
		}
	};

	const handleOpenFullPage = () => {
		window.location.href = `/dashboard/fraud/${alert.id}`;
	};

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
				<DropdownMenuItem onSelect={handleViewDetails}>
					<IconEye className='mr-2 h-4 w-4' />
					View details
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={handleOpenFullPage}>
					<IconExternalLink className='mr-2 h-4 w-4' />
					Open full page
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{alert.status === 'pending' && (
					<DropdownMenuItem onSelect={handleInvestigate}>
						<IconAlertTriangle className='mr-2 h-4 w-4' />
						Mark investigating
					</DropdownMenuItem>
				)}
				{(alert.status === 'pending' || alert.status === 'investigating') && (
					<DropdownMenuItem onSelect={handleResolve}>
						<IconShieldCheck className='mr-2 h-4 w-4' />
						Resolve alert
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const createColumns = (
	onAlertAction?: (action: 'view' | 'investigate' | 'resolve', alertId: string) => void
): ColumnDef<FraudAlert>[] => [
	{
		accessorKey: 'id',
		header: 'Alert ID',
		cell: ({ row }) => {
			const id = row.getValue('id') as string;
			return (
				<div className='font-mono text-xs truncate max-w-[100px]' title={id}>
					{id.substring(0, 8)}...
				</div>
			);
		},
	},
	{
		accessorKey: 'user',
		header: 'User',
		cell: ({ row }) => {
			const alert = row.original;
			const user = alert.user;
			if (!user) {
				return <div className='text-sm text-muted-foreground'>Unknown User</div>;
			}
			const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
			return (
				<div className='flex items-center gap-2'>
					<Avatar className='h-8 w-8'>
						<AvatarImage src={user.profile_image} alt={`${user.first_name} ${user.last_name}`} />
						<AvatarFallback className='text-xs'>{initials || 'U'}</AvatarFallback>
					</Avatar>
					<div className='flex flex-col'>
						<span className='text-sm font-medium'>
							{user.first_name} {user.last_name}
						</span>
						<span className='text-xs text-muted-foreground'>{user.email}</span>
					</div>
				</div>
			);
		},
	},
	{
		accessorKey: 'alert_type',
		header: 'Type',
		cell: ({ row }) => {
			const type = row.getValue('alert_type') as string;
			return <div className='text-sm'>{getAlertTypeLabel(type)}</div>;
		},
	},
	{
		accessorKey: 'alert_level',
		header: 'Severity',
		cell: ({ row }) => {
			const level = row.getValue('alert_level') as string;
			return (
				<Badge variant='secondary' className={getLevelColor(level)}>
					{level.toUpperCase()}
				</Badge>
			);
		},
	},
	{
		accessorKey: 'risk_score',
		header: 'Risk Score',
		cell: ({ row }) => {
			const score = row.getValue('risk_score') as number;
			return <div className={`text-sm font-medium ${getRiskScoreColor(score)}`}>{score}</div>;
		},
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => {
			const status = row.getValue('status') as string;
			return (
				<Badge variant='secondary' className={getStatusColor(status)}>
					{status.replace('_', ' ').toUpperCase()}
				</Badge>
			);
		},
	},
	{
		accessorKey: 'description',
		header: 'Description',
		cell: ({ row }) => {
			const description = row.getValue('description') as string;
			return (
				<div className='max-w-[200px] truncate text-sm text-muted-foreground' title={description}>
					{description}
				</div>
			);
		},
	},
	{
		accessorKey: 'detected_at',
		header: 'Detected',
		cell: ({ row }) => {
			const date = new Date(row.getValue('detected_at'));
			return (
				<div className='text-sm text-muted-foreground'>
					{date.toLocaleDateString()} {date.toLocaleTimeString()}
				</div>
			);
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => <ActionCell alert={row.original} onAlertAction={onAlertAction} />,
	},
];

export function FraudAlertsTable({
	alerts,
	isLoading,
	pagination,
	onPageChange,
	onAlertAction,
}: FraudAlertsTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([]);

	const columns = React.useMemo(() => createColumns(onAlertAction), [onAlertAction]);

	const table = useReactTable({
		data: alerts,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		state: {
			sorting,
		},
	});

	const totalPages = Math.ceil(pagination.total / pagination.limit);
	const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

	if (isLoading) {
		return (
			<div className='space-y-2'>
				{[...Array(5)].map((_, i) => (
					<Skeleton key={i} className='h-16 w-full' />
				))}
			</div>
		);
	}

	if (alerts.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center py-12 text-center'>
				<IconShieldCheck className='h-12 w-12 text-muted-foreground mb-4' />
				<h3 className='text-lg font-semibold'>No fraud alerts found</h3>
				<p className='text-sm text-muted-foreground'>No alerts match your current filters.</p>
			</div>
		);
	}

	return (
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
													header.column.getCanSort() ? 'flex items-center gap-2 cursor-pointer' : ''
												}
												onClick={header.column.getToggleSortingHandler()}
											>
												{flexRender(header.column.columnDef.header, header.getContext())}
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
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
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
						Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
						{pagination.total} alerts
					</p>
					<div className='flex items-center gap-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => onPageChange(pagination.offset - pagination.limit)}
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
							onClick={() => onPageChange(pagination.offset + pagination.limit)}
							disabled={currentPage === totalPages}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
