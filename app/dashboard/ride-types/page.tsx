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
import {
	RideType,
	CreateRideTypeRequest,
	UpdateRideTypeRequest,
} from '@/lib/types/ride-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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

interface FormData {
	name: string;
	description: string;
	icon: string;
	capacity: number;
	sort_order: number;
	is_active: boolean;
}

const DEFAULT_FORM: FormData = {
	name: '',
	description: '',
	icon: '',
	capacity: 4,
	sort_order: 0,
	is_active: true,
};

export default function RideTypesPage() {
	const [data, setData] = useState<RideType[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<RideType | null>(null);
	const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
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
		setFormData({ ...DEFAULT_FORM });
		setDialogOpen(true);
	};

	const handleOpenEdit = (item: RideType) => {
		setEditingItem(item);
		setFormData({
			name: item.name,
			description: item.description || '',
			icon: item.icon || '',
			capacity: item.capacity,
			sort_order: item.sort_order,
			is_active: item.is_active,
		});
		setDialogOpen(true);
	};

	const handleSubmit = async () => {
		if (!formData.name.trim()) {
			toast.error('Name is required');
			return;
		}
		if (formData.capacity < 1) {
			toast.error('Capacity must be at least 1');
			return;
		}
		setIsSubmitting(true);
		try {
			if (editingItem) {
				const payload: UpdateRideTypeRequest = {
					name: formData.name.trim(),
					description: formData.description.trim() || undefined,
					icon: formData.icon.trim() || undefined,
					capacity: formData.capacity,
					sort_order: formData.sort_order,
					is_active: formData.is_active,
				};
				await rideTypesService.updateRideType(editingItem.id, payload);
				toast.success('Ride type updated');
			} else {
				const payload: CreateRideTypeRequest = {
					name: formData.name.trim(),
					description: formData.description.trim() || undefined,
					icon: formData.icon.trim() || undefined,
					capacity: formData.capacity,
					sort_order: formData.sort_order,
					is_active: formData.is_active,
				};
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
						{row.original.icon && (
							<span className='text-lg'>{row.original.icon}</span>
						)}
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
						<DialogContent>
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
							<div className='grid gap-4 py-4'>
								<div className='grid gap-2'>
									<Label htmlFor='name'>
										Name <span className='text-destructive'>*</span>
									</Label>
									<Input
										id='name'
										value={formData.name}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, name: e.target.value }))
										}
										placeholder='e.g., Economy, Premium, XL'
									/>
								</div>
								<div className='grid gap-2'>
									<Label htmlFor='description'>Description</Label>
									<Textarea
										id='description'
										value={formData.description}
										onChange={(e) =>
											setFormData((prev) => ({ ...prev, description: e.target.value }))
										}
										placeholder='Affordable rides for everyday travel'
										rows={2}
									/>
								</div>
								<div className='grid grid-cols-3 gap-4'>
									<div className='grid gap-2'>
										<Label htmlFor='icon'>Icon</Label>
										<Input
											id='icon'
											value={formData.icon}
											onChange={(e) =>
												setFormData((prev) => ({ ...prev, icon: e.target.value }))
											}
											placeholder='icon name'
										/>
									</div>
									<div className='grid gap-2'>
										<Label htmlFor='capacity'>
											Capacity <span className='text-destructive'>*</span>
										</Label>
										<Input
											id='capacity'
											type='number'
											min={1}
											value={formData.capacity}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													capacity: parseInt(e.target.value, 10) || 1,
												}))
											}
										/>
									</div>
									<div className='grid gap-2'>
										<Label htmlFor='sort_order'>Sort Order</Label>
										<Input
											id='sort_order'
											type='number'
											min={0}
											value={formData.sort_order}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													sort_order: parseInt(e.target.value, 10) || 0,
												}))
											}
										/>
									</div>
								</div>
								<div className='flex items-center justify-between'>
									<Label htmlFor='is_active'>Active</Label>
									<Switch
										id='is_active'
										checked={formData.is_active}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({ ...prev, is_active: checked }))
										}
									/>
								</div>
							</div>
							<DialogFooter>
								<Button
									variant='outline'
									onClick={() => setDialogOpen(false)}
									disabled={isSubmitting}
								>
									Cancel
								</Button>
								<Button onClick={handleSubmit} disabled={isSubmitting}>
									{isSubmitting
										? 'Saving...'
										: editingItem
											? 'Update'
											: 'Create'}
								</Button>
							</DialogFooter>
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
