'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	getFilteredRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import { ZoneFee } from '@/lib/types/pricing';
import { pricingService } from '@/lib/api/pricing.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
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

interface PricingZoneFeesTabProps {
	versionId: string;
	onRefresh?: () => void;
}

interface FormData {
	zone_id: string;
	fee_type: string;
	ride_type_id?: string;
	amount: number;
	is_percentage: boolean;
	applies_pickup: boolean;
	applies_dropoff: boolean;
	is_active: boolean;
}

const DEFAULT_FORM: FormData = {
	zone_id: '',
	fee_type: 'pickup_fee',
	amount: 5.0,
	is_percentage: false,
	applies_pickup: true,
	applies_dropoff: false,
	is_active: true,
};

export function PricingZoneFeesTab({
	versionId,
	onRefresh,
}: PricingZoneFeesTabProps) {
	const [data, setData] = useState<ZoneFee[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState({
		total: 0,
		limit: 10,
		offset: 0,
	});

	// Filter state
	const [filterZoneId, setFilterZoneId] = useState<string>('');

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<ZoneFee | null>(null);
	const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Delete state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await pricingService.getZoneFees(versionId, {
				limit: pagination.limit,
				offset: pagination.offset,
				zone_id: filterZoneId || undefined,
			});
			setData(response.data);
			setPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));
		} catch {
			toast.error('Failed to load zone fees');
		} finally {
			setIsLoading(false);
		}
	}, [versionId, pagination.limit, pagination.offset, filterZoneId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleOpenCreate = () => {
		setEditingItem(null);
		setFormData({ ...DEFAULT_FORM, zone_id: filterZoneId || '' });
		setDialogOpen(true);
	};

	const handleOpenEdit = (item: ZoneFee) => {
		setEditingItem(item);
		setFormData({
			zone_id: item.zone_id,
			fee_type: item.fee_type,
			ride_type_id: item.ride_type_id,
			amount: item.amount,
			is_percentage: item.is_percentage,
			applies_pickup: item.applies_pickup,
			applies_dropoff: item.applies_dropoff,
			is_active: item.is_active,
		});
		setDialogOpen(true);
	};

	const handleSubmit = async () => {
		if (!formData.zone_id.trim()) {
			toast.error('Zone ID is required');
			return;
		}
		if (!formData.fee_type.trim()) {
			toast.error('Fee type is required');
			return;
		}
		if (formData.amount <= 0) {
			toast.error('Amount must be greater than 0');
			return;
		}
		if (!formData.applies_pickup && !formData.applies_dropoff) {
			toast.error('At least one of pickup or dropoff must be selected');
			return;
		}
		setIsSubmitting(true);
		try {
			const payload = {
				...formData,
				version_id: versionId,
			};
			if (editingItem) {
				await pricingService.updateZoneFee(editingItem.id, payload);
				toast.success('Zone fee updated');
			} else {
				await pricingService.createZoneFee(versionId, payload);
				toast.success('Zone fee created');
			}
			setDialogOpen(false);
			fetchData();
			onRefresh?.();
		} catch {
			toast.error(
				editingItem
					? 'Failed to update zone fee'
					: 'Failed to create zone fee',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			await pricingService.deleteZoneFee(deletingId);
			toast.success('Zone fee deleted');
			setDeleteDialogOpen(false);
			setDeletingId(null);
			fetchData();
			onRefresh?.();
		} catch {
			toast.error('Failed to delete zone fee');
		}
	};

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	const formatAmount = (item: ZoneFee): string => {
		if (item.is_percentage) return `${item.amount}%`;
		return `$${item.amount.toFixed(2)}`;
	};

	const getAppliesLabel = (item: ZoneFee): string => {
		if (item.applies_pickup && item.applies_dropoff)
			return 'Pickup & Dropoff';
		if (item.applies_pickup) return 'Pickup';
		if (item.applies_dropoff) return 'Dropoff';
		return 'None';
	};

	const columns: ColumnDef<ZoneFee>[] = useMemo(
		() => [
			{
				accessorKey: 'zone_id',
				header: 'Zone',
				cell: ({ row }) => (
					<span
						className='font-mono text-sm'
						title={row.original.zone_id}
					>
						{row.original.zone_id.substring(0, 12)}...
					</span>
				),
			},
			{
				accessorKey: 'fee_type',
				header: 'Fee Type',
				cell: ({ row }) => (
					<Badge variant='outline'>
						{row.original.fee_type.replace(/_/g, ' ')}
					</Badge>
				),
			},
			{
				id: 'amount',
				header: 'Amount',
				cell: ({ row }) => (
					<span className='font-medium'>
						{formatAmount(row.original)}
					</span>
				),
			},
			{
				id: 'applies_to',
				header: 'Applies To',
				cell: ({ row }) => (
					<span className='text-sm'>
						{getAppliesLabel(row.original)}
					</span>
				),
			},
			{
				accessorKey: 'ride_type_id',
				header: 'Ride Type',
				cell: ({ row }) => (
					<span className='text-sm'>
						{row.original.ride_type_id
							? `${row.original.ride_type_id.substring(0, 8)}...`
							: 'All'}
					</span>
				),
			},
			{
				accessorKey: 'is_active',
				header: 'Status',
				cell: ({ row }) => (
					<Badge
						variant={
							row.original.is_active ? 'default' : 'secondary'
						}
					>
						{row.original.is_active ? 'Active' : 'Inactive'}
					</Badge>
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
		getFilteredRowModel: getFilteredRowModel(),
		onSortingChange: setSorting,
		state: { sorting },
	});

	const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
	const totalPages = Math.ceil(pagination.total / pagination.limit);

	return (
		<div className='space-y-4'>
			<div className='flex flex-wrap items-end justify-between gap-3'>
				<div className='space-y-1.5'>
					<Label className='text-xs text-muted-foreground'>
						Zone ID
					</Label>
					<Input
						placeholder='Filter by Zone ID...'
						value={filterZoneId}
						onChange={(e) => {
							setFilterZoneId(e.target.value);
							setPagination((prev) => ({ ...prev, offset: 0 }));
						}}
						className='w-62.5'
					/>
				</div>
				<Button onClick={handleOpenCreate}>
					<IconPlus className='mr-2 h-4 w-4' />
					Add Zone Fee
				</Button>
			</div>

			{isLoading ? (
				<div className='space-y-2'>
					{[...Array(5)].map((_, i) => (
						<Skeleton key={i} className='h-12 w-full' />
					))}
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
															header.column
																.columnDef
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
										<TableRow key={row.id}>
											{row
												.getVisibleCells()
												.map((cell) => (
													<TableCell key={cell.id}>
														{flexRender(
															cell.column
																.columnDef.cell,
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
											No zone fees found.
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
								{Math.min(
									pagination.offset + pagination.limit,
									pagination.total,
								)}{' '}
								of {pagination.total} fees
							</p>
							<div className='flex items-center gap-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() =>
										handlePageChange(
											Math.max(
												0,
												pagination.offset -
													pagination.limit,
											),
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
										handlePageChange(
											pagination.offset +
												pagination.limit,
										)
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
					)}
				</div>
			)}

			{/* Create/Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingItem ? 'Edit Zone Fee' : 'Add Zone Fee'}
						</DialogTitle>
						<DialogDescription>
							{editingItem
								? 'Update the zone fee configuration.'
								: 'Create a new zone-based fee.'}
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='zone_id'>Zone ID</Label>
							<Input
								id='zone_id'
								value={formData.zone_id}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										zone_id: e.target.value,
									}))
								}
								placeholder='Enter zone ID'
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='fee_type'>Fee Type</Label>
							<Input
								id='fee_type'
								value={formData.fee_type}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										fee_type: e.target.value,
									}))
								}
								placeholder='e.g., pickup_fee, dropoff_fee, toll'
							/>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='ride_type_id'>
								Ride Type ID (optional)
							</Label>
							<Input
								id='ride_type_id'
								value={formData.ride_type_id ?? ''}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										ride_type_id:
											e.target.value || undefined,
									}))
								}
								placeholder='Leave empty for all ride types'
							/>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='grid gap-2'>
								<Label htmlFor='amount'>Amount</Label>
								<Input
									id='amount'
									type='number'
									step={0.01}
									min={0}
									value={formData.amount}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											amount:
												parseFloat(e.target.value) || 0,
										}))
									}
								/>
							</div>
							<div className='flex items-end pb-2'>
								<div className='flex items-center gap-2'>
									<Checkbox
										id='is_percentage'
										checked={formData.is_percentage}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												is_percentage: !!checked,
											}))
										}
									/>
									<Label
										htmlFor='is_percentage'
										className='font-normal cursor-pointer'
									>
										Percentage
									</Label>
								</div>
							</div>
						</div>
						<div className='flex items-center gap-6'>
							<div className='flex items-center gap-2'>
								<Checkbox
									id='applies_pickup'
									checked={formData.applies_pickup}
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											applies_pickup: !!checked,
										}))
									}
								/>
								<Label
									htmlFor='applies_pickup'
									className='font-normal cursor-pointer'
								>
									Applies to Pickup
								</Label>
							</div>
							<div className='flex items-center gap-2'>
								<Checkbox
									id='applies_dropoff'
									checked={formData.applies_dropoff}
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											applies_dropoff: !!checked,
										}))
									}
								/>
								<Label
									htmlFor='applies_dropoff'
									className='font-normal cursor-pointer'
								>
									Applies to Dropoff
								</Label>
							</div>
						</div>
						<div className='flex items-center justify-between'>
							<Label htmlFor='is_active'>Active</Label>
							<Switch
								id='is_active'
								checked={formData.is_active}
								onCheckedChange={(checked) =>
									setFormData((prev) => ({
										...prev,
										is_active: checked,
									}))
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
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Zone Fee</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this zone fee? This
							action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeletingId(null)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
