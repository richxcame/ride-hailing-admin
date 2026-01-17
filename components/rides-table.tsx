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
	IconMapPin,
	IconExternalLink,
	IconX,
	IconStar,
} from '@tabler/icons-react';
import { Ride } from '@/lib/types/models';
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

interface RidesTableProps {
	rides: Ride[];
	isLoading: boolean;
	pagination: {
		total: number;
		limit: number;
		offset: number;
	};
	onPageChange: (offset: number) => void;
	onRideAction?: (action: 'view' | 'cancel', rideId: string) => void;
}

const formatCurrency = (value: number) => {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(value);
};

const getStatusColor = (status: string) => {
	const colors = {
		requested: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
		accepted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
		in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
		completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
		cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
	};
	return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

// Define columns outside component to avoid recreation
const createColumns = (): ColumnDef<Ride>[] => [
	{
		accessorKey: 'id',
		header: 'Ride ID',
		cell: ({ row }) => {
			const id = row.getValue('id') as string;
			return <span className='font-mono text-xs'>{id.substring(0, 8)}...</span>;
		},
	},
	{
		accessorKey: 'rider',
		header: 'Rider',
		cell: ({ row }) => {
			const ride = row.original;
			return ride.rider ? (
				<div className='flex items-center gap-2'>
					<Avatar className='h-8 w-8'>
						<AvatarImage src={ride.rider.profile_image} alt={ride.rider.first_name} />
						<AvatarFallback className='text-xs bg-primary/10'>
							{ride.rider.first_name?.charAt(0)}
							{ride.rider.last_name?.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<div className='flex flex-col'>
						<span className='font-medium text-sm'>
							{ride.rider.first_name} {ride.rider.last_name}
						</span>
						<span className='text-xs text-muted-foreground'>{ride.rider.phone_number}</span>
					</div>
				</div>
			) : (
				<span className='text-muted-foreground'>N/A</span>
			);
		},
	},
	{
		accessorKey: 'driver',
		header: 'Driver',
		cell: ({ row }) => {
			const ride = row.original;
			return ride.driver ? (
				<div className='flex items-center gap-2'>
					<Avatar className='h-8 w-8'>
						<AvatarImage src={ride.driver.profile_image} alt={ride.driver.first_name} />
						<AvatarFallback className='text-xs bg-primary/10'>
							{ride.driver.first_name?.charAt(0)}
							{ride.driver.last_name?.charAt(0)}
						</AvatarFallback>
					</Avatar>
					<div className='flex flex-col'>
						<span className='font-medium text-sm'>
							{ride.driver.first_name} {ride.driver.last_name}
						</span>
						<span className='text-xs text-muted-foreground'>{ride.driver.phone_number}</span>
					</div>
				</div>
			) : (
				<Badge variant='secondary'>Unassigned</Badge>
			);
		},
	},
	{
		accessorKey: 'route',
		header: 'Route',
		cell: ({ row }) => {
			const ride = row.original;
			return (
				<div className='flex max-w-[200px] flex-col gap-1 text-xs'>
					<div className='flex items-start gap-1'>
						<IconMapPin className='mt-0.5 h-3 w-3 shrink-0 text-green-600' />
						<span className='line-clamp-1'>{ride.pickup_address}</span>
					</div>
					<div className='flex items-start gap-1'>
						<IconMapPin className='mt-0.5 h-3 w-3 shrink-0 text-red-600' />
						<span className='line-clamp-1'>{ride.dropoff_address}</span>
					</div>
				</div>
			);
		},
	},
	{
		accessorKey: 'status',
		header: ({ column }) => {
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Status
					{column.getIsSorted() === 'asc' ? (
						<IconChevronUp className='ml-2 h-4 w-4' />
					) : column.getIsSorted() === 'desc' ? (
						<IconChevronDown className='ml-2 h-4 w-4' />
					) : null}
				</Button>
			);
		},
		cell: ({ row }) => {
			const status = row.getValue('status') as string;
			return (
				<Badge variant='outline' className={getStatusColor(status)}>
					{status.replace('_', ' ')}
				</Badge>
			);
		},
	},
	{
		accessorKey: 'final_fare',
		header: ({ column }) => {
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Fare
					{column.getIsSorted() === 'asc' ? (
						<IconChevronUp className='ml-2 h-4 w-4' />
					) : column.getIsSorted() === 'desc' ? (
						<IconChevronDown className='ml-2 h-4 w-4' />
					) : null}
				</Button>
			);
		},
		cell: ({ row }) => {
			const ride = row.original;
			const fare = ride.final_fare || ride.estimated_fare || 0;
			return <span className='font-medium'>{formatCurrency(fare)}</span>;
		},
	},
	{
		accessorKey: 'rating',
		header: 'Rating',
		cell: ({ row }) => {
			const ride = row.original;
			if (ride.status !== 'completed' || !ride.rating) {
				return <span className='text-muted-foreground text-sm'>-</span>;
			}
			return (
				<div className='flex items-center gap-1'>
					<IconStar className='h-4 w-4 fill-yellow-400 text-yellow-400' />
					<span className='font-medium text-sm'>{ride.rating.toFixed(1)}</span>
				</div>
			);
		},
	},
	{
		accessorKey: 'requested_at',
		header: ({ column }) => {
			return (
				<Button
					variant='ghost'
					onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
				>
					Time
					{column.getIsSorted() === 'asc' ? (
						<IconChevronUp className='ml-2 h-4 w-4' />
					) : column.getIsSorted() === 'desc' ? (
						<IconChevronDown className='ml-2 h-4 w-4' />
					) : null}
				</Button>
			);
		},
		cell: ({ row }) => {
			const date = new Date(row.getValue('requested_at'));
			return (
				<div className='flex flex-col text-xs'>
					<span>{date.toLocaleDateString()}</span>
					<span className='text-muted-foreground'>{date.toLocaleTimeString()}</span>
				</div>
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
	ride,
	onRideAction,
}: {
	ride: Ride;
	onRideAction?: (action: 'view' | 'cancel', rideId: string) => void;
}) {
	const handleViewDetails = () => {
		if (onRideAction) {
			onRideAction('view', ride.id);
		}
	};

	const handleOpenFullPage = () => {
		window.location.href = `/dashboard/rides/${ride.id}`;
	};

	const handleCancelRide = () => {
		if (onRideAction) {
			onRideAction('cancel', ride.id);
		}
	};

	const canCancel = ride.status === 'requested' || ride.status === 'accepted';

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
				<DropdownMenuItem onClick={() => navigator.clipboard.writeText(ride.id)}>
					Copy ride ID
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
				{canCancel && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={handleCancelRide} className='text-destructive'>
							<IconX className='mr-2 h-4 w-4' />
							Cancel ride
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const columns = createColumns();

export function RidesTable({
	rides,
	isLoading,
	pagination,
	onPageChange,
	onRideAction,
}: RidesTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([]);

	const table = useReactTable({
		data: rides,
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
						<Skeleton className='h-10 w-full' />
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
											: flexRender(header.column.columnDef.header, header.getContext())}
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
												<ActionCell ride={row.original} onRideAction={onRideAction} />
											) : (
												flexRender(cell.column.columnDef.cell, cell.getContext())
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={columns.length} className='h-24 text-center'>
									No rides found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className='flex items-center justify-between'>
				<div className='text-sm text-muted-foreground'>
					Showing {pagination.offset + 1} to{' '}
					{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}{' '}
					rides
				</div>
				<div className='flex gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => onPageChange(Math.max(0, pagination.offset - pagination.limit))}
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
