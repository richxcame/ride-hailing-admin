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
	IconUserCheck,
	IconUserX,
	IconStar,
	IconExternalLink,
} from '@tabler/icons-react';
import { Driver } from '@/lib/types/models';
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
import { Avatar } from '@/components/ui/avatar';

interface DriversTableProps {
	drivers: Driver[];
	isLoading: boolean;
	pagination: {
		total: number;
		limit: number;
		offset: number;
	};
	onPageChange: (offset: number) => void;
	showActions?: boolean;
	onDriverAction?: (action: 'approve' | 'reject' | 'view', driverId: string) => void;
}

// Define columns outside component to avoid recreation
const createColumns = (): ColumnDef<Driver>[] => [
	{
		accessorKey: 'user',
		header: '',
		cell: ({ row }) => {
			const driver = row.original;
			return (
				<Avatar className='h-8 w-8'>
					{driver.user?.profile_image ? (
						<img src={driver.user.profile_image} alt={driver.user.first_name} />
					) : (
						<div className='flex h-full w-full items-center justify-center bg-primary/10 text-xs font-medium'>
							{driver.user?.first_name?.charAt(0)}
							{driver.user?.last_name?.charAt(0)}
						</div>
					)}
				</Avatar>
			);
		},
	},
	{
		accessorKey: 'license_number',
		header: ({ column }) => {
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					License #
					{column.getIsSorted() === 'asc' ? (
						<IconChevronUp className='ml-2 h-4 w-4' />
					) : column.getIsSorted() === 'desc' ? (
						<IconChevronDown className='ml-2 h-4 w-4' />
					) : null}
				</Button>
			);
		},
		cell: ({ row }) => {
			const driver = row.original;
			return (
				<div className='flex flex-col'>
					<span className='font-medium'>{driver.license_number}</span>
					{driver.user && (
						<span className='text-xs text-muted-foreground'>
							{driver.user.first_name} {driver.user.last_name}
						</span>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: 'vehicle_model',
		header: 'Vehicle',
		cell: ({ row }) => {
			const driver = row.original;
			return (
				<div className='flex flex-col'>
					<span className='font-medium'>
						{driver.vehicle_year} {driver.vehicle_model}
					</span>
					<span className='text-xs text-muted-foreground'>
						{driver.vehicle_color} • {driver.vehicle_plate}
					</span>
				</div>
			);
		},
	},
	{
		accessorKey: 'rating',
		header: 'Rating',
		cell: ({ row }) => {
			const rating = row.getValue('rating') as number;
			return (
				<div className='flex items-center gap-1'>
					<IconStar className='h-4 w-4 fill-yellow-400 text-yellow-400' />
					<span className='font-medium'>{rating?.toFixed(1) || 'N/A'}</span>
				</div>
			);
		},
	},
	{
		accessorKey: 'total_rides',
		header: 'Total Rides',
		cell: ({ row }) => {
			const totalRides = row.getValue('total_rides') as number;
			return <span className='font-medium'>{totalRides || 0}</span>;
		},
	},
	{
		accessorKey: 'approval_status',
		header: 'Status',
		cell: ({ row }) => {
			const driver = row.original;
			if (driver.approval_status === 'pending') {
				return (
					<Badge variant='outline' className='border-orange-500 text-orange-600'>
						Pending
					</Badge>
				);
			}
			if (driver.approval_status === 'rejected') {
				return (
					<Badge variant='destructive'>
						Rejected
					</Badge>
				);
			}
			return driver.is_online ? (
				<Badge className='bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'>
					Online
				</Badge>
			) : (
				<Badge variant='secondary'>Offline</Badge>
			);
		},
	},
	{
		accessorKey: 'created_at',
		header: 'Joined',
		cell: ({ row }) => {
			const date = new Date(row.getValue('created_at'));
			return (
				<span className='text-sm text-muted-foreground'>
					{date.toLocaleDateString()}
				</span>
			);
		},
	},
	{
		id: 'actions',
		cell: () => null, // Placeholder - will be overridden
	},
];

// Action cell component that receives props directly
function ActionCell({
	driver,
	showActions,
	onDriverAction,
}: {
	driver: Driver;
	showActions: boolean;
	onDriverAction?: (action: 'approve' | 'reject' | 'view', driverId: string) => void;
}) {
	if (showActions && onDriverAction) {
		return (
			<div className='flex gap-2'>
				<Button
					size='sm'
					variant='default'
					className='bg-green-600 hover:bg-green-700'
					onClick={() => onDriverAction('approve', driver.id)}
				>
					<IconUserCheck className='mr-1 h-4 w-4' />
					Approve
				</Button>
				<Button
					size='sm'
					variant='destructive'
					onClick={() => onDriverAction('reject', driver.id)}
				>
					<IconUserX className='mr-1 h-4 w-4' />
					Reject
				</Button>
			</div>
		);
	}

	const handleViewDetails = () => {
		if (onDriverAction) {
			onDriverAction('view', driver.id);
		}
	};

	const handleOpenFullPage = () => {
		window.location.href = `/dashboard/drivers/${driver.id}`;
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
				<DropdownMenuItem
					onClick={() => navigator.clipboard.writeText(driver.id)}
				>
					Copy driver ID
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={handleViewDetails}>
					<IconEye className='mr-2 h-4 w-4' />
					View details
				</DropdownMenuItem>
				<DropdownMenuItem onSelect={handleOpenFullPage}>
					<IconExternalLink className='mr-2 h-4 w-4' />
					Open full page
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const columns = createColumns();

export function DriversTable({
	drivers,
	isLoading,
	pagination,
	onPageChange,
	showActions = false,
	onDriverAction,
}: DriversTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([]);

	const table = useReactTable({
		data: drivers,
		columns,
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		state: {
			sorting,
		},
	});

	if (isLoading) {
		return (
			<div className='space-y-3'>
				{[...Array(5)].map((_, i) => (
					<div key={i} className='flex items-center gap-4'>
						<Skeleton className='h-10 w-10 rounded-full' />
						<div className='space-y-2'>
							<Skeleton className='h-4 w-50' />
							<Skeleton className='h-3 w-36' />
						</div>
					</div>
				))}
			</div>
		);
	}

	const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
	const totalPages = Math.ceil(pagination.total / pagination.limit);

	return (
		<div className='space-y-4'>
			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
											  )}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{cell.column.id === 'actions' ? (
												<ActionCell
													driver={row.original}
													showActions={showActions}
													onDriverAction={onDriverAction}
												/>
											) : (
												flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className='h-24 text-center'
								>
									No drivers found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className='flex items-center justify-between'>
				<div className='text-sm text-muted-foreground'>
					Showing {pagination.offset + 1} to{' '}
					{Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
					{pagination.total} drivers
				</div>
				<div className='flex gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() =>
							onPageChange(Math.max(0, pagination.offset - pagination.limit))
						}
						disabled={pagination.offset === 0}
					>
						Previous
					</Button>
					<div className='flex items-center gap-1'>
						<span className='text-sm'>
							Page {currentPage} of {totalPages}
						</span>
					</div>
					<Button
						variant='outline'
						size='sm'
						onClick={() => onPageChange(pagination.offset + pagination.limit)}
						disabled={pagination.offset + pagination.limit >= pagination.total}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}
