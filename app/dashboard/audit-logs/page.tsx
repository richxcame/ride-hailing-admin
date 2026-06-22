'use client';

import { Fragment, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	IconRefresh,
	IconChevronRight,
	IconChevronDown,
	IconHistory,
	IconSearch,
} from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import { AdminAuditLog } from '@/lib/types/audit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const NIL_UUID = '00000000-0000-0000-0000-000000000000';
const PAGE_SIZE = 20;

// The backend stamps system-initiated actions with the nil admin UUID.
function actionBadgeVariant(
	action: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
	if (/reject|suspend|delete|ban|remove|fail|revoke/.test(action)) return 'destructive';
	if (/approve|activate|create|add|pass|grant/.test(action)) return 'default';
	if (/archive|deactivate/.test(action)) return 'secondary';
	return 'outline';
}

export default function AuditLogsPage() {
	const [data, setData] = useState<AdminAuditLog[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [pagination, setPagination] = useState({ total: 0, offset: 0 });
	const [actionFilter, setActionFilter] = useState('');
	const [targetType, setTargetType] = useState('all');
	const [refreshTick, setRefreshTick] = useState(0);
	const [expanded, setExpanded] = useState<Set<string>>(new Set());

	// Action filter is applied explicitly (Enter / Search) via refreshTick so we
	// don't fire a request on every keystroke.
	useEffect(() => {
		let active = true;
		adminService
			.getAuditLogs({
				limit: PAGE_SIZE,
				offset: pagination.offset,
				action: actionFilter.trim() || undefined,
				target_type: targetType !== 'all' ? targetType : undefined,
			})
			.then((res) => {
				if (!active) return;
				setData(res.data);
				setPagination((p) => ({ ...p, total: res.meta.total }));
			})
			.catch(() => active && toast.error('Failed to load audit logs'))
			.finally(() => active && setIsLoading(false));
		return () => {
			active = false;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.offset, targetType, refreshTick]);

	const search = () => {
		setExpanded(new Set());
		setPagination((p) => ({ ...p, offset: 0 }));
		setRefreshTick((t) => t + 1);
	};

	const toggle = (id: string) =>
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});

	const adminLabel = (log: AdminAuditLog) => {
		if (log.metadata?.admin_name) return log.metadata.admin_name;
		if (!log.admin_id || log.admin_id === NIL_UUID) return 'System';
		return `${log.admin_id.slice(0, 8)}…`;
	};

	const currentPage = Math.floor(pagination.offset / PAGE_SIZE) + 1;
	const totalPages = Math.max(1, Math.ceil(pagination.total / PAGE_SIZE));

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Audit Logs</h1>
					<p className='text-sm text-muted-foreground'>
						Every administrative action — who changed what, and when.
					</p>
				</div>
				<Button variant='outline' size='sm' onClick={() => setRefreshTick((t) => t + 1)}>
					<IconRefresh className='mr-2 h-4 w-4' />
					Refresh
				</Button>
			</div>

			{/* Filters */}
			<div className='flex flex-wrap items-end gap-3'>
				<div className='space-y-1.5'>
					<Label className='text-xs text-muted-foreground'>Action</Label>
					<div className='flex gap-2'>
						<Input
							value={actionFilter}
							onChange={(e) => setActionFilter(e.target.value)}
							onKeyDown={(e) => e.key === 'Enter' && search()}
							placeholder='e.g. approve_driver'
							className='w-56'
						/>
						<Button variant='secondary' size='icon' onClick={search}>
							<IconSearch className='h-4 w-4' />
						</Button>
					</div>
				</div>
				<div className='space-y-1.5'>
					<Label className='text-xs text-muted-foreground'>Target Type</Label>
					<Select
						value={targetType}
						onValueChange={(v) => {
							setTargetType(v);
							setExpanded(new Set());
							setPagination((p) => ({ ...p, offset: 0 }));
						}}
					>
						<SelectTrigger className='w-44'>
							<SelectValue placeholder='All types' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='all'>All types</SelectItem>
							<SelectItem value='user'>User</SelectItem>
							<SelectItem value='driver'>Driver</SelectItem>
							<SelectItem value='ride'>Ride</SelectItem>
							<SelectItem value='document'>Document</SelectItem>
							<SelectItem value='vehicle'>Vehicle</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{isLoading ? (
				<div className='space-y-2'>
					{[...Array(8)].map((_, i) => (
						<Skeleton key={i} className='h-12 w-full' />
					))}
				</div>
			) : (
				<div className='space-y-4'>
					<div className='rounded-md border'>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className='w-10' />
									<TableHead>Timestamp</TableHead>
									<TableHead>Action</TableHead>
									<TableHead>Target</TableHead>
									<TableHead>Changed By</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.length ? (
									data.map((log) => {
										const hasMeta =
											log.metadata && Object.keys(log.metadata).length > 0;
										return (
											<Fragment key={log.id}>
												<TableRow>
													<TableCell>
														{hasMeta && (
															<Button
																variant='ghost'
																size='sm'
																className='h-6 w-6 p-0'
																onClick={() => toggle(log.id)}
															>
																{expanded.has(log.id) ? (
																	<IconChevronDown className='h-4 w-4' />
																) : (
																	<IconChevronRight className='h-4 w-4' />
																)}
															</Button>
														)}
													</TableCell>
													<TableCell className='whitespace-nowrap text-sm text-muted-foreground'>
														{new Date(log.created_at).toLocaleString()}
													</TableCell>
													<TableCell>
														<Badge variant={actionBadgeVariant(log.action)}>
															{log.action}
														</Badge>
													</TableCell>
													<TableCell className='text-sm'>
														<span className='font-medium capitalize'>
															{log.target_type?.replace(/_/g, ' ') || '—'}
														</span>
														{log.target_id && log.target_id !== NIL_UUID && (
															<span className='ml-2 font-mono text-xs text-muted-foreground'>
																{log.target_id.slice(0, 8)}…
															</span>
														)}
													</TableCell>
													<TableCell className='text-sm'>{adminLabel(log)}</TableCell>
												</TableRow>
												{expanded.has(log.id) && hasMeta && (
													<TableRow>
														<TableCell colSpan={5} className='bg-muted/50 p-4'>
															<p className='mb-1 text-xs font-semibold text-muted-foreground'>
																Metadata
															</p>
															<pre className='max-h-64 overflow-x-auto rounded-md bg-muted p-3 text-xs'>
																{JSON.stringify(log.metadata, null, 2)}
															</pre>
														</TableCell>
													</TableRow>
												)}
											</Fragment>
										);
									})
								) : (
									<TableRow>
										<TableCell colSpan={5} className='h-24 text-center'>
											<div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
												<IconHistory className='h-8 w-8' />
												<span>No audit logs found.</span>
											</div>
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
								{Math.min(pagination.offset + PAGE_SIZE, pagination.total)} of{' '}
								{pagination.total} entries
							</p>
							<div className='flex items-center gap-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() =>
										setPagination((p) => ({
											...p,
											offset: Math.max(0, p.offset - PAGE_SIZE),
										}))
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
										setPagination((p) => ({ ...p, offset: p.offset + PAGE_SIZE }))
									}
									disabled={pagination.offset + PAGE_SIZE >= pagination.total}
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
