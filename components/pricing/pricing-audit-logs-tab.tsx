'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { toast } from 'sonner';
import { PricingAuditLog } from '@/lib/types/pricing';
import { pricingService } from '@/lib/api/pricing.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export function PricingAuditLogsTab() {
	const [data, setData] = useState<PricingAuditLog[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });
	const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
	const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const params: Record<string, unknown> = {
				limit: pagination.limit,
				offset: pagination.offset,
			};
			if (entityTypeFilter && entityTypeFilter !== 'all') {
				params.entity_type = entityTypeFilter;
			}
			const response = await pricingService.getAuditLogs(params);
			setData(response.data);
			setPagination((prev) => ({ ...prev, total: response.meta.total }));
		} catch {
			toast.error('Failed to load audit logs');
		} finally {
			setIsLoading(false);
		}
	}, [pagination.limit, pagination.offset, entityTypeFilter]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const toggleRow = (id: string) => {
		setExpandedRows((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	const getActionBadgeVariant = (action: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
		if (action.includes('delete') || action.includes('remove')) return 'destructive';
		if (action.includes('create') || action.includes('add')) return 'default';
		if (action.includes('activate')) return 'default';
		if (action.includes('archive')) return 'secondary';
		return 'outline';
	};

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	const columns: ColumnDef<PricingAuditLog>[] = useMemo(
		() => [
			{
				id: 'expand',
				header: '',
				cell: ({ row }) => {
					const hasChanges = row.original.old_value || row.original.new_value;
					if (!hasChanges) return null;
					return (
						<Button
							variant='ghost'
							size='sm'
							className='h-6 w-6 p-0'
							onClick={() => toggleRow(row.original.id)}
						>
							{expandedRows.has(row.original.id) ? (
								<IconChevronDown className='h-4 w-4' />
							) : (
								<IconChevronRight className='h-4 w-4' />
							)}
						</Button>
					);
				},
				size: 40,
			},
			{
				accessorKey: 'created_at',
				header: 'Timestamp',
				cell: ({ row }) => (
					<span className='text-sm text-muted-foreground whitespace-nowrap'>
						{new Date(row.original.created_at).toLocaleString()}
					</span>
				),
			},
			{
				accessorKey: 'action',
				header: 'Action',
				cell: ({ row }) => (
					<Badge variant={getActionBadgeVariant(row.original.action)}>
						{row.original.action}
					</Badge>
				),
			},
			{
				accessorKey: 'entity_type',
				header: 'Entity Type',
				cell: ({ row }) => (
					<span className='text-sm font-medium capitalize'>
						{row.original.entity_type.replace(/_/g, ' ')}
					</span>
				),
			},
			{
				accessorKey: 'entity_id',
				header: 'Entity ID',
				cell: ({ row }) => (
					<span className='text-sm font-mono text-muted-foreground'>
						{row.original.entity_id.substring(0, 8)}...
					</span>
				),
			},
			{
				accessorKey: 'changed_by',
				header: 'Changed By',
				cell: ({ row }) => (
					<span className='text-sm'>
						{row.original.changed_by
							? `${row.original.changed_by.substring(0, 8)}...`
							: 'System'}
					</span>
				),
			},
		],
		[expandedRows],
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
		<div className='space-y-4'>
			{/* Filter */}
			<div className='flex items-end gap-3'>
				<div className='space-y-2'>
					<label className='text-sm font-medium'>Entity Type</label>
					<Select
						value={entityTypeFilter}
						onValueChange={(value) => {
							setEntityTypeFilter(value);
							setPagination((prev) => ({ ...prev, offset: 0 }));
						}}
					>
						<SelectTrigger className='w-48'>
							<SelectValue placeholder='All types' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All types</SelectItem>
							<SelectItem value='pricing_config'>Pricing Config</SelectItem>
							<SelectItem value='pricing_version'>Pricing Version</SelectItem>
							<SelectItem value='surge_threshold'>Surge Threshold</SelectItem>
							<SelectItem value='time_multiplier'>Time Multiplier</SelectItem>
							<SelectItem value='weather_multiplier'>Weather Multiplier</SelectItem>
							<SelectItem value='event_multiplier'>Event Multiplier</SelectItem>
							<SelectItem value='zone_fee'>Zone Fee</SelectItem>
							<SelectItem value='cancellation_tier'>Cancellation Tier</SelectItem>
						</SelectContent>
					</Select>
				</div>
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
										<Fragment key={row.id}>
											<TableRow>
												{row.getVisibleCells().map((cell) => (
													<TableCell key={cell.id}>
														{flexRender(
															cell.column.columnDef.cell,
															cell.getContext(),
														)}
													</TableCell>
												))}
											</TableRow>
											{expandedRows.has(row.original.id) && (
												<TableRow key={`${row.id}-detail`}>
													<TableCell colSpan={columns.length} className='bg-muted/50 p-4'>
														<div className='grid gap-4 md:grid-cols-2'>
															{row.original.old_value && (
																<div>
																	<p className='text-xs font-semibold text-muted-foreground mb-1'>Previous Value</p>
																	<pre className='text-xs rounded-md bg-muted p-3 overflow-x-auto max-h-48'>
																		{JSON.stringify(row.original.old_value, null, 2)}
																	</pre>
																</div>
															)}
															{row.original.new_value && (
																<div>
																	<p className='text-xs font-semibold text-muted-foreground mb-1'>New Value</p>
																	<pre className='text-xs rounded-md bg-muted p-3 overflow-x-auto max-h-48'>
																		{JSON.stringify(row.original.new_value, null, 2)}
																	</pre>
																</div>
															)}
														</div>
													</TableCell>
												</TableRow>
											)}
										</Fragment>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={columns.length}
											className='h-24 text-center'
										>
											No audit logs found.
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
								of {pagination.total} entries
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
		</div>
	);
}
