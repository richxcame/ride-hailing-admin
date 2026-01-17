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
import { IconChevronDown, IconChevronUp, IconDots, IconEye, IconUserOff, IconUserCheck, IconExternalLink } from '@tabler/icons-react';
import Link from 'next/link';
import { User } from '@/lib/types/models';
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

interface UsersTableProps {
	users: User[];
	isLoading: boolean;
	pagination: {
		total: number;
		limit: number;
		offset: number;
	};
	onPageChange: (offset: number) => void;
	onUserAction: (action: 'suspend' | 'activate' | 'view', userId: string) => void;
}

export function UsersTable({
	users,
	isLoading,
	pagination,
	onPageChange,
	onUserAction,
}: UsersTableProps) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});

	const columns: ColumnDef<User>[] = [
		{
			accessorKey: 'profile_image',
			header: '',
			cell: ({ row }) => {
				const user = row.original;
				return (
					<Avatar className='h-8 w-8'>
						{user.profile_image ? (
							<img src={user.profile_image} alt={user.first_name} />
						) : (
							<div className='flex h-full w-full items-center justify-center bg-primary/10 text-xs font-medium'>
								{user.first_name.charAt(0)}
								{user.last_name.charAt(0)}
							</div>
						)}
					</Avatar>
				);
			},
		},
		{
			accessorKey: 'email',
			header: ({ column }) => {
				return (
					<Button
						variant='ghost'
						onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
					>
						Email
						{column.getIsSorted() === 'asc' ? (
							<IconChevronUp className='ml-2 h-4 w-4' />
						) : column.getIsSorted() === 'desc' ? (
							<IconChevronDown className='ml-2 h-4 w-4' />
						) : null}
					</Button>
				);
			},
			cell: ({ row }) => {
				const user = row.original;
				return (
					<div className='flex flex-col'>
						<span className='font-medium'>{user.email}</span>
						<span className='text-xs text-muted-foreground'>
							{user.first_name} {user.last_name}
						</span>
					</div>
				);
			},
		},
		{
			accessorKey: 'phone_number',
			header: 'Phone',
			cell: ({ row }) => (
				<span className='text-sm'>{row.getValue('phone_number')}</span>
			),
		},
		{
			accessorKey: 'role',
			header: 'Role',
			cell: ({ row }) => {
				const role = row.getValue('role') as string;
				const roleColors = {
					admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
					driver: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
					rider: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
				};
				return (
					<Badge
						variant='outline'
						className={roleColors[role as keyof typeof roleColors]}
					>
						{role.charAt(0).toUpperCase() + role.slice(1)}
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
			accessorKey: 'is_verified',
			header: 'Verified',
			cell: ({ row }) => {
				const isVerified = row.getValue('is_verified') as boolean;
				return (
					<Badge variant={isVerified ? 'outline' : 'secondary'}>
						{isVerified ? 'Yes' : 'No'}
					</Badge>
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
			cell: ({ row }) => {
				const user = row.original;

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
								onClick={() => navigator.clipboard.writeText(user.id)}
							>
								Copy user ID
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => onUserAction('view', user.id)}>
								<IconEye className='mr-2 h-4 w-4' />
								View details
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link href={`/dashboard/users/${user.id}`}>
									<IconExternalLink className='mr-2 h-4 w-4' />
									Open full page
								</Link>
							</DropdownMenuItem>
							{user.is_active ? (
								<DropdownMenuItem
									className='text-destructive'
									onClick={() => onUserAction('suspend', user.id)}
								>
									<IconUserOff className='mr-2 h-4 w-4' />
									Suspend user
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem
									onClick={() => onUserAction('activate', user.id)}
								>
									<IconUserCheck className='mr-2 h-4 w-4' />
									Activate user
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		},
	];

	const table = useReactTable({
		data: users,
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
						<Skeleton className='h-10 w-10 rounded-full' />
						<div className='space-y-2'>
							<Skeleton className='h-4 w-[250px]' />
							<Skeleton className='h-3 w-[200px]' />
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
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
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
									No users found.
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
					{pagination.total} users
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
