'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import {
	IconPlus,
	IconEdit,
	IconTrash,
	IconCategory,
	IconRefresh,
	IconWorld,
	IconBuilding,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { rideTypesService } from '@/lib/api/ride-types.service';
import { RideType, CreateRideTypeRequest } from '@/lib/types/ride-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CountryAvailabilityTab } from '@/components/ride-types/country-availability-tab';
import { CityAvailabilityTab } from '@/components/ride-types/city-availability-tab';
import { RideTypeIcon } from '@/components/ride-types/ride-type-icon';
import { RideTypeForm } from '@/components/ride-types/ride-type-form';

export default function RideTypesPage() {
	const [data, setData] = useState<RideType[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<RideType | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Delete state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await rideTypesService.getRideTypes({
				limit: pagination.limit,
				offset: pagination.offset,
				include_inactive: true,
			});
			setData(response.data);
			setPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));
		} catch {
			toast.error('Failed to load ride types');
		} finally {
			setIsLoading(false);
		}
	}, [pagination.limit, pagination.offset]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleOpenCreate = () => {
		setEditingItem(null);
		setDialogOpen(true);
	};

	const handleOpenEdit = (item: RideType) => {
		setEditingItem(item);
		setDialogOpen(true);
	};

	const handleFormSubmit = async (payload: CreateRideTypeRequest) => {
		setIsSubmitting(true);
		try {
			if (editingItem) {
				await rideTypesService.updateRideType(editingItem.id, payload);
				toast.success('Ride type updated');
			} else {
				await rideTypesService.createRideType(payload);
				toast.success('Ride type created');
			}
			setDialogOpen(false);
			fetchData();
		} catch {
			toast.error(editingItem ? 'Failed to update ride type' : 'Failed to create ride type');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			await rideTypesService.deleteRideType(deletingId);
			toast.success('Ride type deleted');
			setDeleteDialogOpen(false);
			setDeletingId(null);
			fetchData();
		} catch {
			toast.error('Failed to delete ride type');
		}
	};

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	const columns: ColumnDef<RideType>[] = useMemo(
		() => [
			{
				accessorKey: 'name',
				header: 'Name',
				cell: ({ row }) => (
					<div className='flex items-center gap-2'>
						<RideTypeIcon
							iconUrl={row.original.icon_url}
							icon={row.original.icon}
							name={row.original.name}
							size='sm'
						/>
						<span className='font-medium'>{row.original.name}</span>
					</div>
				),
			},
			{
				accessorKey: 'description',
				header: 'Description',
				cell: ({ row }) => (
					<span className='text-sm text-muted-foreground'>
						{row.original.description || '-'}
					</span>
				),
			},
			{
				accessorKey: 'capacity',
				header: 'Capacity',
				cell: ({ row }) => (
					<span className='text-sm'>{row.original.capacity} seats</span>
				),
			},
			{
				accessorKey: 'sort_order',
				header: 'Sort Order',
				cell: ({ row }) => (
					<span className='text-sm'>{row.original.sort_order}</span>
				),
			},
			{
				accessorKey: 'is_active',
				header: 'Status',
				cell: ({ row }) => (
					<Badge variant={row.original.is_active ? 'default' : 'secondary'}>
						{row.original.is_active ? 'Active' : 'Inactive'}
					</Badge>
				),
			},
			{
				accessorKey: 'created_at',
				header: 'Created',
				cell: ({ row }) => (
					<span className='text-sm text-muted-foreground'>
						{new Date(row.original.created_at).toLocaleDateString()}
					</span>
				),
			},
			{
				id: 'actions',
				header: '',
				cell: ({ row }) => (
					<div className='flex items-center gap-1'>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => handleOpenEdit(row.original)}
						>
							<IconEdit className='h-4 w-4' />
						</Button>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => {
								setDeletingId(row.original.id);
								setDeleteDialogOpen(true);
							}}
						>
							<IconTrash className='h-4 w-4 text-destructive' />
						</Button>
					</div>
				),
			},
		],
		[],
	);

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		state: { sorting },
	});

	const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
	const totalPages = Math.ceil(pagination.total / pagination.limit);

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Ride Types</h1>
					<p className='text-sm text-muted-foreground'>
						Manage global ride type products (Economy, Premium, XL, etc.)
					</p>
				</div>
				<Button variant='outline' size='sm' onClick={() => fetchData()}>
					<IconRefresh className='mr-2 h-4 w-4' />
					Refresh
				</Button>
			</div>

			<Tabs defaultValue='global' className='space-y-4'>
				<TabsList>
					<TabsTrigger value='global'>
						<IconCategory className='h-4 w-4 mr-1.5' />
						Global Types
					</TabsTrigger>
					<TabsTrigger value='country'>
						<IconWorld className='h-4 w-4 mr-1.5' />
						Country Availability
					</TabsTrigger>
					<TabsTrigger value='city'>
						<IconBuilding className='h-4 w-4 mr-1.5' />
						City Availability
					</TabsTrigger>
				</TabsList>

				<TabsContent value='global'>
					<div className='flex justify-end mb-4'>
						<Button onClick={handleOpenCreate}>
							<IconPlus className='mr-2 h-4 w-4' />
							Add Ride Type
						</Button>
					</div>
					{isLoading ? (
						<div className='space-y-2'>
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className='h-12 w-full' />
							))}
						</div>
					) : data.length === 0 ? (
						<div className='flex flex-col items-center justify-center py-12 text-center'>
							<IconCategory className='h-12 w-12 text-muted-foreground mb-4' />
							<h3 className='text-lg font-semibold'>No Ride Types Yet</h3>
							<p className='text-sm text-muted-foreground mb-4'>
								Create your first ride type to get started
							</p>
							<Button onClick={handleOpenCreate}>
								<IconPlus className='mr-2 h-4 w-4' />
								Add Ride Type
							</Button>
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
														{header.isPlaceholder
															? null
															: flexRender(
																	header.column.columnDef.header,
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
											))
										) : (
											<TableRow>
												<TableCell
													colSpan={columns.length}
													className='h-24 text-center'
												>
													No ride types found.
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
										{Math.min(pagination.offset + pagination.limit, pagination.total)}{' '}
										of {pagination.total} ride types
									</p>
									<div className='flex items-center gap-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() =>
												handlePageChange(
													Math.max(0, pagination.offset - pagination.limit),
												)
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
												handlePageChange(pagination.offset + pagination.limit)
											}
											disabled={pagination.offset + pagination.limit >= pagination.total}
										>
											Next
										</Button>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Create/Edit Dialog */}
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogContent size='lg'>
							<DialogHeader>
								<DialogTitle>
									{editingItem ? 'Edit Ride Type' : 'Add Ride Type'}
								</DialogTitle>
								<DialogDescription>
									{editingItem
										? 'Update the ride type configuration.'
										: 'Create a new ride type product.'}
								</DialogDescription>
							</DialogHeader>
							<RideTypeForm
								key={editingItem?.id ?? 'new'}
								initial={editingItem}
								isSubmitting={isSubmitting}
								onSubmit={handleFormSubmit}
								onCancel={() => setDialogOpen(false)}
							/>
						</DialogContent>
					</Dialog>

					{/* Delete Confirmation */}
					<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete Ride Type</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to delete this ride type? This will also remove
									all country and city availability mappings. This action cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel onClick={() => setDeletingId(null)}>
									Cancel
								</AlertDialogCancel>
								<AlertDialogAction onClick={handleDelete} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>Delete</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</TabsContent>

				<TabsContent value='country'>
					<CountryAvailabilityTab />
				</TabsContent>

				<TabsContent value='city'>
					<CityAvailabilityTab />
				</TabsContent>
			</Tabs>
		</div>
	);
}
