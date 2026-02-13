'use client';

import * as React from 'react';
import {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import {
	IconChevronDown,
	IconChevronUp,
	IconDots,
	IconEdit,
	IconX,
	IconCheck,
} from '@tabler/icons-react';
import { PricingZone, ZoneType } from '@/lib/types/geography';
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

const zoneTypeColors: Record<ZoneType, string> = {
	airport: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
	downtown:
		'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
	transit_hub:
		'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
	event_venue:
		'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
	border_crossing:
		'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
	toll_zone: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const zoneTypeLabels: Record<ZoneType, string> = {
	airport: 'Airport',
	downtown: 'Downtown',
	transit_hub: 'Transit Hub',
	event_venue: 'Event Venue',
	border_crossing: 'Border Crossing',
	toll_zone: 'Toll Zone',
};

interface ZonesTableProps {
	zones: PricingZone[];
	isLoading: boolean;
	pagination: {
		total: number;
		limit: number;
		offset: number;
	};
	onPageChange: (offset: number) => void;
	onAction: (action: 'edit' | 'toggle_active', zoneId: string) => void;
}

export function ZonesTable({
	zones,
	isLoading,
	pagination,
	onPageChange,
	onAction,
}: ZonesTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});

	const columns: ColumnDef<PricingZone>[] = [
		{
			accessorKey: 'name',
			header: ({ column }) => {
				return (
					<Button
						variant='ghost'
						onClick={() =>
							column.toggleSorting(column.getIsSorted() === 'asc')
						}
					>
						Name
						{column.getIsSorted() === 'asc' ? (
							<IconChevronUp className='ml-2 h-4 w-4' />
						) : column.getIsSorted() === 'desc' ? (
							<IconChevronDown className='ml-2 h-4 w-4' />
						) : null}
					</Button>
				);
			},
			cell: ({ row }) => (
				<span className='font-medium'>{row.getValue('name')}</span>
			),
		},
		{
			accessorKey: 'zone_type',
			header: 'Zone Type',
			cell: ({ row }) => {
				const zoneType = row.getValue('zone_type') as ZoneType;
				return (
					<Badge
						variant='outline'
						className={zoneTypeColors[zoneType]}
					>
						{zoneTypeLabels[zoneType]}
					</Badge>
				);
			},
		},
		{
			accessorKey: 'is_active',
			header: 'Status',
			cell: ({ row }) => {
				const isActive = row.getValue('is_active') as boolean;
				return (
					<Badge variant={isActive ? 'default' : 'secondary'}>
						{isActive ? 'Active' : 'Inactive'}
					</Badge>
				);
			},
		},
		{
			accessorKey: 'created_at',
			header: 'Created',
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
			cell: ({ row }) => {
				const zone = row.original;

				return (
					<div onClick={(e) => e.stopPropagation()}>
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
									onClick={() => onAction('edit', zone.id)}
								>
									<IconEdit className='mr-2 h-4 w-4' />
									Edit
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								{zone.is_active ? (
									<DropdownMenuItem
										className='text-destructive'
										onClick={() =>
											onAction('toggle_active', zone.id)
										}
									>
										<IconX className='mr-2 h-4 w-4' />
										Deactivate
									</DropdownMenuItem>
								) : (
									<DropdownMenuItem
										onClick={() =>
											onAction('toggle_active', zone.id)
										}
									>
										<IconCheck className='mr-2 h-4 w-4' />
										Activate
									</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data: zones,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	if (isLoading) {
		return (
			<div className='space-y-3'>
				{[...Array(5)].map((_, i) => (
					<div key={i} className='flex items-center gap-4'>
						<div className='space-y-2'>
							<Skeleton className='h-4 w-62.5' />
							<Skeleton className='h-3 w-62.5' />
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
													header.column.columnDef
														.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={
										row.getIsSelected() && 'selected'
									}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
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
									No zones found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className='flex items-center justify-between'>
				<div className='text-sm text-muted-foreground'>
					Showing {pagination.offset + 1} to{' '}
					{Math.min(
						pagination.offset + pagination.limit,
						pagination.total,
					)}{' '}
					of {pagination.total} zones
				</div>
				<div className='flex gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() =>
							onPageChange(
								Math.max(
									0,
									pagination.offset - pagination.limit,
								),
							)
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
						onClick={() =>
							onPageChange(pagination.offset + pagination.limit)
						}
						disabled={
							pagination.offset + pagination.limit >=
							pagination.total
						}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
}
