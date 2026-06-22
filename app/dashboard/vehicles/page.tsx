'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import {
	IconRefresh,
	IconCar,
	IconCheck,
	IconX,
	IconAlertTriangle,
	IconChevronUp,
	IconChevronDown,
	IconSearch,
	IconFilter,
	IconShield,
	IconClock,
	IconEye,
	IconTruck,
} from '@tabler/icons-react';
import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { vehiclesService } from '@/lib/api/vehicles.service';
import { Vehicle, VehicleStats } from '@/lib/types/vehicles';
import { PaginationMeta } from '@/lib/types/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date?: string) {
	if (!date) return '—';
	return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysUntil(date?: string) {
	if (!date) return null;
	return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function driverName(v: Vehicle) {
	if (v.driver) return `${v.driver.first_name} ${v.driver.last_name}`;
	return 'Unknown';
}

function driverUserId(v: Vehicle) {
	return v.driver?.user_id ?? v.driver_id;
}

function StatusBadge({ status }: { status: Vehicle['status'] }) {
	const styles: Record<Vehicle['status'], string> = {
		pending:   'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300',
		approved:  'bg-green-100  text-green-800  border-green-200  dark:bg-green-900/40  dark:text-green-300',
		rejected:  'bg-red-100    text-red-800    border-red-200    dark:bg-red-900/40    dark:text-red-300',
		suspended: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300',
		retired:   'bg-muted      text-muted-foreground',
	};
	return <Badge className={styles[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

function ExpiryBadge({ date }: { date?: string }) {
	const days = daysUntil(date);
	if (days === null) return <span className='text-muted-foreground text-xs'>—</span>;
	if (days < 0)  return <Badge className='bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'>Expired</Badge>;
	if (days <= 7)  return <Badge className='bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'>{days}d left</Badge>;
	if (days <= 14) return <Badge className='bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300'>{days}d left</Badge>;
	return <Badge className='bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'>{days}d left</Badge>;
}

const CATEGORY_LABELS: Record<Vehicle['category'], string> = {
	economy: 'Economy', comfort: 'Comfort', premium: 'Premium',
	lux: 'Luxury', xl: 'XL', wav: 'Wheelchair', electric: 'Electric',
};

function PaginationBar({ meta, onPageChange, label }: { meta: PaginationMeta; onPageChange: (offset: number) => void; label: string }) {
	const totalPages = Math.ceil(meta.total / meta.limit);
	const currentPage = Math.floor(meta.offset / meta.limit) + 1;
	if (totalPages <= 1) return null;
	return (
		<div className='flex items-center justify-between mt-4'>
			<p className='text-sm text-muted-foreground'>
				Showing {meta.offset + 1}–{Math.min(meta.offset + meta.limit, meta.total)} of {meta.total} {label}
			</p>
			<div className='flex items-center gap-2'>
				<Button variant='outline' size='sm' onClick={() => onPageChange(meta.offset - meta.limit)} disabled={currentPage === 1}>Previous</Button>
				<span className='text-sm text-muted-foreground'>{currentPage} / {totalPages}</span>
				<Button variant='outline' size='sm' onClick={() => onPageChange(meta.offset + meta.limit)} disabled={currentPage === totalPages}>Next</Button>
			</div>
		</div>
	);
}

// ─── Stats Cards ─────────────────────────────────────────────────────────────

interface StatCardProps {
	label: string;
	value: number | undefined;
	loading: boolean;
	accent: string;
	iconColor: string;
	icon: React.ReactNode;
	note?: string;
	urgent?: boolean;
}

function StatCard({ label, value, loading, accent, iconColor, icon, note, urgent }: StatCardProps) {
	return (
		<Card className={`flex flex-col ${urgent && (value ?? 0) > 0 ? 'border-red-200 dark:border-red-800' : ''}`}>
			<CardContent className='p-5 flex flex-col flex-1'>
				<div className='flex items-center justify-between mb-3'>
					<p className='text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight'>{label}</p>
					<div className={`rounded-xl p-2 shrink-0 ml-2 ${accent}`}>
						<span className={iconColor}>{icon}</span>
					</div>
				</div>
				{loading ? (
					<Skeleton className='h-8 w-16' />
				) : (
					<p className={`text-3xl font-bold tabular-nums ${urgent && (value ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
						{value ?? 0}
					</p>
				)}
				{note && <p className='text-xs text-muted-foreground mt-auto pt-3'>{note}</p>}
			</CardContent>
		</Card>
	);
}

// ─── Column definitions ───────────────────────────────────────────────────────

function usePendingColumns(onApprove: (v: Vehicle) => void, onReject: (v: Vehicle) => void): ColumnDef<Vehicle>[] {
	return [
		{
			accessorKey: 'make',
			header: 'Vehicle',
			cell: ({ row }) => {
				const v = row.original;
				return (
					<div>
						<Link href={`/dashboard/vehicles/${v.id}`} className='font-medium hover:underline'>
							{v.year} {v.make} {v.model}
						</Link>
						<p className='text-xs text-muted-foreground capitalize'>{v.color} · {CATEGORY_LABELS[v.category]}</p>
					</div>
				);
			},
		},
		{
			accessorKey: 'license_plate',
			header: 'Plate',
			cell: ({ row }) => <code className='text-xs bg-muted px-1.5 py-0.5 rounded font-mono'>{row.original.license_plate}</code>,
		},
		{
			id: 'driver',
			header: 'Driver',
			cell: ({ row }) => {
				const v = row.original;
				return (
					<div>
						<Link href={`/dashboard/drivers/${driverUserId(v)}`} className='text-sm hover:underline text-blue-600 dark:text-blue-400 font-medium'>
							{driverName(v)}
						</Link>
						{v.driver?.phone_number && <p className='text-xs text-muted-foreground'>{v.driver.phone_number}</p>}
					</div>
				);
			},
		},
		{
			accessorKey: 'created_at',
			header: ({ column }) => (
				<button className='flex items-center gap-1 hover:text-foreground text-xs' onClick={() => column.toggleSorting()}>
					Submitted
					{column.getIsSorted() === 'asc' ? <IconChevronUp className='h-3 w-3' /> : column.getIsSorted() === 'desc' ? <IconChevronDown className='h-3 w-3' /> : <IconChevronDown className='h-3 w-3 opacity-30' />}
				</button>
			),
			cell: ({ row }) => <span className='text-xs text-muted-foreground'>{formatDate(row.original.created_at)}</span>,
		},
		{
			id: 'actions',
			cell: ({ row }) => (
				<div className='flex items-center gap-1.5'>
					<Button size='sm' variant='outline' className='h-7 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950' onClick={() => onApprove(row.original)}>
						<IconCheck className='h-3 w-3 mr-1' />Approve
					</Button>
					<Button size='sm' variant='outline' className='h-7 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950' onClick={() => onReject(row.original)}>
						<IconX className='h-3 w-3 mr-1' />Reject
					</Button>
				</div>
			),
		},
	];
}

function useExpiringColumns(): ColumnDef<Vehicle>[] {
	return [
		{
			accessorKey: 'make',
			header: 'Vehicle',
			cell: ({ row }) => {
				const v = row.original;
				return (
					<div>
						<Link href={`/dashboard/vehicles/${v.id}`} className='font-medium hover:underline'>
							{v.year} {v.make} {v.model}
						</Link>
						<p className='text-xs text-muted-foreground font-mono'>{v.license_plate}</p>
					</div>
				);
			},
		},
		{
			id: 'driver',
			header: 'Driver',
			cell: ({ row }) => {
				const v = row.original;
				return (
					<Link href={`/dashboard/drivers/${driverUserId(v)}`} className='text-sm hover:underline text-blue-600 dark:text-blue-400'>
						{driverName(v)}
					</Link>
				);
			},
		},
		{
			accessorKey: 'insurance_expiry',
			header: 'Insurance',
			cell: ({ row }) => (
				<div className='flex items-center gap-2'>
					<ExpiryBadge date={row.original.insurance_expiry} />
					<span className='text-xs text-muted-foreground'>{formatDate(row.original.insurance_expiry)}</span>
				</div>
			),
		},
		{
			accessorKey: 'registration_expiry',
			header: 'Registration',
			cell: ({ row }) => (
				<div className='flex items-center gap-2'>
					<ExpiryBadge date={row.original.registration_expiry} />
					<span className='text-xs text-muted-foreground'>{formatDate(row.original.registration_expiry)}</span>
				</div>
			),
		},
		{
			accessorKey: 'inspection_expiry',
			header: 'Inspection',
			cell: ({ row }) => (
				<div className='flex items-center gap-2'>
					<ExpiryBadge date={row.original.inspection_expiry} />
					<span className='text-xs text-muted-foreground'>{formatDate(row.original.inspection_expiry)}</span>
				</div>
			),
		},
		{
			id: 'view',
			cell: ({ row }) => (
				<Link href={`/dashboard/vehicles/${row.original.id}`}>
					<Button size='sm' variant='ghost' className='h-7 text-xs'><IconEye className='h-3 w-3 mr-1' />View</Button>
				</Link>
			),
		},
	];
}

function useAllColumns(onSuspend: (v: Vehicle) => void): ColumnDef<Vehicle>[] {
	return [
		{
			accessorKey: 'make',
			header: 'Vehicle',
			cell: ({ row }) => {
				const v = row.original;
				return (
					<div>
						<Link href={`/dashboard/vehicles/${v.id}`} className='font-medium hover:underline'>
							{v.year} {v.make} {v.model}
						</Link>
						<p className='text-xs text-muted-foreground capitalize'>{v.color}</p>
					</div>
				);
			},
		},
		{
			accessorKey: 'license_plate',
			header: 'Plate',
			cell: ({ row }) => <code className='text-xs bg-muted px-1.5 py-0.5 rounded font-mono'>{row.original.license_plate}</code>,
		},
		{
			accessorKey: 'category',
			header: 'Category',
			cell: ({ row }) => <span className='text-sm'>{CATEGORY_LABELS[row.original.category]}</span>,
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ row }) => <StatusBadge status={row.original.status} />,
		},
		{
			id: 'driver',
			header: 'Driver',
			cell: ({ row }) => {
				const v = row.original;
				return (
					<div>
						<Link href={`/dashboard/drivers/${driverUserId(v)}`} className='text-sm hover:underline text-blue-600 dark:text-blue-400 font-medium'>
							{driverName(v)}
						</Link>
						{v.driver && (
							<p className='text-xs text-muted-foreground'>
								⭐ {v.driver.rating?.toFixed(1) ?? '—'} · {v.driver.total_rides} rides
							</p>
						)}
					</div>
				);
			},
		},
		{
			accessorKey: 'created_at',
			header: ({ column }) => (
				<button className='flex items-center gap-1 hover:text-foreground text-xs' onClick={() => column.toggleSorting()}>
					Added
					{column.getIsSorted() === 'asc' ? <IconChevronUp className='h-3 w-3' /> : column.getIsSorted() === 'desc' ? <IconChevronDown className='h-3 w-3' /> : <IconChevronDown className='h-3 w-3 opacity-30' />}
				</button>
			),
			cell: ({ row }) => <span className='text-xs text-muted-foreground'>{formatDate(row.original.created_at)}</span>,
		},
		{
			id: 'actions',
			cell: ({ row }) => {
				const v = row.original;
				return (
					<div className='flex items-center gap-1.5'>
						<Link href={`/dashboard/vehicles/${v.id}`}>
							<Button size='sm' variant='ghost' className='h-7 text-xs'><IconEye className='h-3 w-3 mr-1' />View</Button>
						</Link>
						{v.status === 'approved' && (
							<Button size='sm' variant='outline' className='h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950' onClick={() => onSuspend(v)}>
								<IconShield className='h-3 w-3 mr-1' />Suspend
							</Button>
						)}
					</div>
				);
			},
		},
	];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const reviewSchema = z
	.object({
		action: z.enum(['approve', 'reject']),
		rejection_reason: z.string(),
	})
	.refine((d) => d.action !== 'reject' || d.rejection_reason.trim().length > 0, {
		message: 'Rejection reason is required',
		path: ['rejection_reason'],
	});
type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function VehiclesPage() {
	const [activeTab, setActiveTab] = useState('pending');

	const [stats, setStats] = useState<VehicleStats | null>(null);
	const [isLoadingStats, setIsLoadingStats] = useState(true);

	const [pendingVehicles, setPendingVehicles] = useState<Vehicle[]>([]);
	const [isLoadingPending, setIsLoadingPending] = useState(true);
	const [pendingMeta, setPendingMeta] = useState<PaginationMeta>({ total: 0, limit: 20, offset: 0, total_pages: 0 });
	const [pendingSorting, setPendingSorting] = useState<SortingState>([]);

	const [expiringVehicles, setExpiringVehicles] = useState<Vehicle[]>([]);
	const [expiringCount, setExpiringCount] = useState(0);
	const [isLoadingExpiring, setIsLoadingExpiring] = useState(true);
	const [expiringDays, setExpiringDays] = useState(30);
	const [expiringSorting, setExpiringSorting] = useState<SortingState>([]);

	const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
	const [isLoadingAll, setIsLoadingAll] = useState(true);
	const [allMeta, setAllMeta] = useState<PaginationMeta>({ total: 0, limit: 20, offset: 0, total_pages: 0 });
	const [allSorting, setAllSorting] = useState<SortingState>([]);
	const [statusFilter, setStatusFilter] = useState('all');
	const [categoryFilter, setCategoryFilter] = useState('all');
	const [searchInput, setSearchInput] = useState('');
	const [searchQuery, setSearchQuery] = useState('');

	const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
	const [reviewVehicle, setReviewVehicle] = useState<Vehicle | null>(null);
	const reviewForm = useForm<ReviewFormValues>({
		resolver: zodResolver(reviewSchema),
		defaultValues: { action: 'approve', rejection_reason: '' },
	});
	const reviewAction = reviewForm.watch('action');

	const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
	const [suspendVehicle, setSuspendVehicle] = useState<Vehicle | null>(null);
	const [suspendReason, setSuspendReason] = useState('');
	const [isSubmittingSuspend, setIsSubmittingSuspend] = useState(false);

	// ── Fetchers ──────────────────────────────────────────────────────────────

	const fetchStats = useCallback(async () => {
		try {
			setIsLoadingStats(true);
			setStats(await vehiclesService.getStats());
		} catch {
			toast.error('Failed to load vehicle stats');
		} finally {
			setIsLoadingStats(false);
		}
	}, []);

	const fetchPending = useCallback(async (offset = 0) => {
		try {
			setIsLoadingPending(true);
			const res = await vehiclesService.getPending({ limit: pendingMeta.limit, offset });
			setPendingVehicles(res.data);
			setPendingMeta(prev => ({ ...prev, ...res.meta }));
		} catch {
			toast.error('Failed to load pending vehicles');
		} finally {
			setIsLoadingPending(false);
		}
	}, [pendingMeta.limit]);

	const fetchExpiring = useCallback(async () => {
		try {
			setIsLoadingExpiring(true);
			const res = await vehiclesService.getExpiring({ days: expiringDays });
			setExpiringVehicles(res.vehicles);
			setExpiringCount(res.count);
		} catch {
			toast.error('Failed to load expiring vehicles');
		} finally {
			setIsLoadingExpiring(false);
		}
	}, [expiringDays]);

	const fetchAll = useCallback(async (offset = 0) => {
		try {
			setIsLoadingAll(true);
			const res = await vehiclesService.getAll({
				limit: allMeta.limit,
				offset,
				status: statusFilter !== 'all' ? (statusFilter as Vehicle['status']) : undefined,
				category: categoryFilter !== 'all' ? (categoryFilter as Vehicle['category']) : undefined,
				search: searchQuery || undefined,
			});
			setAllVehicles(res.data);
			setAllMeta(prev => ({ ...prev, ...res.meta }));
		} catch {
			toast.error('Failed to load vehicles');
		} finally {
			setIsLoadingAll(false);
		}
	}, [allMeta.limit, statusFilter, categoryFilter, searchQuery]);

	useEffect(() => { fetchStats(); }, [fetchStats]);
	useEffect(() => { fetchPending(0); }, [fetchPending]);
	useEffect(() => { fetchExpiring(); }, [fetchExpiring]);
	useEffect(() => { fetchAll(0); }, [fetchAll]);

	const handleRefresh = () => {
		fetchStats();
		fetchPending(pendingMeta.offset);
		fetchExpiring();
		fetchAll(allMeta.offset);
		toast.success('Refreshed');
	};

	// ── Actions ───────────────────────────────────────────────────────────────

	const openApprove = (v: Vehicle) => { setReviewVehicle(v); reviewForm.reset({ action: 'approve', rejection_reason: '' }); setReviewDialogOpen(true); };
	const openReject  = (v: Vehicle) => { setReviewVehicle(v); reviewForm.reset({ action: 'reject',  rejection_reason: '' }); setReviewDialogOpen(true); };
	const openSuspend = (v: Vehicle) => { setSuspendVehicle(v); setSuspendReason(''); setSuspendDialogOpen(true); };

	const onReviewSubmit = async (values: ReviewFormValues) => {
		if (!reviewVehicle) return;
		try {
			await vehiclesService.reviewVehicle(reviewVehicle.id, { approved: values.action === 'approve', rejection_reason: values.action === 'reject' ? values.rejection_reason.trim() : undefined });
			toast.success(`Vehicle ${values.action === 'approve' ? 'approved' : 'rejected'}`);
			setReviewDialogOpen(false);
			fetchPending(pendingMeta.offset);
			fetchStats();
		} catch (e) {
			toast.error(`Failed to ${values.action} vehicle`, { description: e instanceof Error ? e.message : undefined });
		}
	};

	const submitSuspend = async () => {
		if (!suspendVehicle || !suspendReason.trim()) return;
		try {
			setIsSubmittingSuspend(true);
			await vehiclesService.suspendVehicle(suspendVehicle.id, { reason: suspendReason.trim() });
			toast.success('Vehicle suspended');
			setSuspendDialogOpen(false);
			fetchAll(allMeta.offset);
			fetchStats();
		} catch (e) {
			toast.error('Failed to suspend vehicle', { description: e instanceof Error ? e.message : undefined });
		} finally {
			setIsSubmittingSuspend(false);
		}
	};

	// ── Tables ────────────────────────────────────────────────────────────────

	const pendingCols  = usePendingColumns(openApprove, openReject);
	const expiringCols = useExpiringColumns();
	const allCols      = useAllColumns(openSuspend);

	const pendingTable  = useReactTable({ data: pendingVehicles,  columns: pendingCols,  state: { sorting: pendingSorting  }, onSortingChange: setPendingSorting,  getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
	const expiringTable = useReactTable({ data: expiringVehicles, columns: expiringCols, state: { sorting: expiringSorting }, onSortingChange: setExpiringSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
	const allTable      = useReactTable({ data: allVehicles,      columns: allCols,      state: { sorting: allSorting      }, onSortingChange: setAllSorting,      getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });

	const expiringAlert = (stats?.expiring_insurance ?? 0) + (stats?.expiring_registration ?? 0);

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<div className='flex flex-1 flex-col gap-6 p-4 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Vehicles</h1>
					<p className='text-sm text-muted-foreground'>Manage driver vehicles, approvals, and document compliance</p>
				</div>
				<Button variant='outline' size='sm' onClick={handleRefresh}>
					<IconRefresh className='h-4 w-4 mr-2' />Refresh
				</Button>
			</div>

			{/* Stats */}
			<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
				<StatCard label='Total Vehicles'     value={stats?.total_vehicles}        loading={isLoadingStats} accent='bg-blue-100 dark:bg-blue-900/40'    iconColor='text-blue-600 dark:text-blue-400'    icon={<IconTruck className='h-5 w-5' />} />
				<StatCard label='Pending Review'     value={stats?.pending_review}        loading={isLoadingStats} accent='bg-yellow-100 dark:bg-yellow-900/40' iconColor='text-yellow-600 dark:text-yellow-400' icon={<IconClock className='h-5 w-5' />} note={stats?.pending_review ? 'Needs action' : 'All clear'} />
				<StatCard label='Approved'           value={stats?.approved_vehicles}     loading={isLoadingStats} accent='bg-green-100 dark:bg-green-900/40'   iconColor='text-green-600 dark:text-green-400'   icon={<IconCheck className='h-5 w-5' />} />
				<StatCard label='Suspended'          value={stats?.suspended_vehicles}    loading={isLoadingStats} accent='bg-orange-100 dark:bg-orange-900/40' iconColor='text-orange-600 dark:text-orange-400' icon={<IconShield className='h-5 w-5' />} />
				<StatCard label='Insurance Expiring' value={stats?.expiring_insurance}    loading={isLoadingStats} accent='bg-red-100 dark:bg-red-900/40'       iconColor='text-red-600 dark:text-red-400'       icon={<IconAlertTriangle className='h-5 w-5' />} urgent note='Within 30 days' />
				<StatCard label='Reg. Expiring'      value={stats?.expiring_registration} loading={isLoadingStats} accent='bg-red-100 dark:bg-red-900/40'       iconColor='text-red-600 dark:text-red-400'       icon={<IconAlertTriangle className='h-5 w-5' />} urgent note='Within 30 days' />
			</div>

			{/* Tabs */}
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList>
					<TabsTrigger value='pending' className='gap-2'>
						Pending Review
						{(stats?.pending_review ?? 0) > 0 && (
							<span className='rounded-full bg-yellow-500 text-white text-[10px] font-semibold min-w-[18px] h-[18px] flex items-center justify-center px-1'>
								{stats?.pending_review}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value='expiring' className='gap-2'>
						Expiring Documents
						{expiringAlert > 0 && (
							<span className='rounded-full bg-red-500 text-white text-[10px] font-semibold min-w-[18px] h-[18px] flex items-center justify-center px-1'>
								{expiringAlert}
							</span>
						)}
					</TabsTrigger>
					<TabsTrigger value='all'>All Vehicles</TabsTrigger>
				</TabsList>

				{/* ── Pending ── */}
				<TabsContent value='pending' className='mt-4'>
					<Card>
						<CardHeader className='pb-3'>
							<CardTitle className='text-base'>Pending Review</CardTitle>
							<p className='text-sm text-muted-foreground'>Vehicles awaiting admin approval before drivers can go online</p>
						</CardHeader>
						<CardContent>
							{isLoadingPending ? (
								<div className='space-y-3'>{[...Array(5)].map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
							) : pendingVehicles.length === 0 ? (
								<div className='flex flex-col items-center justify-center py-14 text-center gap-2'>
									<div className='rounded-full bg-green-100 dark:bg-green-900/40 p-3 mb-1'>
										<IconCheck className='h-6 w-6 text-green-600 dark:text-green-400' />
									</div>
									<p className='font-medium'>All caught up!</p>
									<p className='text-sm text-muted-foreground'>No vehicles are pending review</p>
								</div>
							) : (
								<>
									<div className='rounded-md border overflow-hidden'>
										<Table>
											<TableHeader>
												{pendingTable.getHeaderGroups().map(hg => (
													<TableRow key={hg.id} className='bg-muted/50'>
														{hg.headers.map(h => <TableHead key={h.id} className='text-xs uppercase tracking-wide font-semibold'>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}
													</TableRow>
												))}
											</TableHeader>
											<TableBody>
												{pendingTable.getRowModel().rows.map(row => (
													<TableRow key={row.id} className='hover:bg-muted/40'>
														{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
									<PaginationBar meta={pendingMeta} onPageChange={fetchPending} label='vehicles' />
								</>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ── Expiring ── */}
				<TabsContent value='expiring' className='mt-4'>
					<Card>
						<CardHeader className='pb-3'>
							<div className='flex items-center justify-between'>
								<div>
									<CardTitle className='text-base'>Expiring Documents</CardTitle>
									<p className='text-sm text-muted-foreground mt-0.5'>
										{isLoadingExpiring ? '…' : `${expiringCount} vehicle${expiringCount !== 1 ? 's' : ''} with documents expiring within ${expiringDays} days`}
									</p>
								</div>
								<div className='flex items-center gap-2'>
									<Label className='text-xs text-muted-foreground'>Window</Label>
									<Select value={String(expiringDays)} onValueChange={v => setExpiringDays(Number(v))}>
										<SelectTrigger className='w-24 h-8 text-xs'><SelectValue /></SelectTrigger>
										<SelectContent>
											{[7, 14, 30, 60, 90].map(d => <SelectItem key={d} value={String(d)}>{d} days</SelectItem>)}
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{isLoadingExpiring ? (
								<div className='space-y-3'>{[...Array(5)].map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
							) : expiringVehicles.length === 0 ? (
								<div className='flex flex-col items-center justify-center py-14 text-center gap-2'>
									<div className='rounded-full bg-green-100 dark:bg-green-900/40 p-3 mb-1'>
										<IconCheck className='h-6 w-6 text-green-600 dark:text-green-400' />
									</div>
									<p className='font-medium'>All documents current</p>
									<p className='text-sm text-muted-foreground'>No vehicles expiring in the next {expiringDays} days</p>
								</div>
							) : (
								<div className='rounded-md border overflow-hidden'>
									<Table>
										<TableHeader>
											{expiringTable.getHeaderGroups().map(hg => (
												<TableRow key={hg.id} className='bg-muted/50'>
													{hg.headers.map(h => <TableHead key={h.id} className='text-xs uppercase tracking-wide font-semibold'>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}
												</TableRow>
											))}
										</TableHeader>
										<TableBody>
											{expiringTable.getRowModel().rows.map(row => (
												<TableRow key={row.id} className='hover:bg-muted/40'>
													{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ── All Vehicles ── */}
				<TabsContent value='all' className='mt-4'>
					<Card>
						<CardHeader className='pb-3'>
							<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
								<div>
									<CardTitle className='text-base'>All Vehicles</CardTitle>
									<p className='text-sm text-muted-foreground mt-0.5'>{allMeta.total} vehicles total</p>
								</div>
								<div className='flex flex-wrap items-center gap-2'>
									<div className='relative'>
										<IconSearch className='absolute left-2.5 top-2 h-4 w-4 text-muted-foreground' />
										<Input
											placeholder='Search make, model, plate…'
											className='pl-8 h-8 w-52 text-xs'
											value={searchInput}
											onChange={e => setSearchInput(e.target.value)}
											onKeyDown={e => { if (e.key === 'Enter') setSearchQuery(searchInput); }}
										/>
									</div>
									<Select value={statusFilter} onValueChange={setStatusFilter}>
										<SelectTrigger className='h-8 w-36 text-xs'>
											<IconFilter className='h-3 w-3 mr-1 shrink-0' /><SelectValue placeholder='Status' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>All statuses</SelectItem>
											<SelectItem value='pending'>Pending</SelectItem>
											<SelectItem value='approved'>Approved</SelectItem>
											<SelectItem value='rejected'>Rejected</SelectItem>
											<SelectItem value='suspended'>Suspended</SelectItem>
											<SelectItem value='retired'>Retired</SelectItem>
										</SelectContent>
									</Select>
									<Select value={categoryFilter} onValueChange={setCategoryFilter}>
										<SelectTrigger className='h-8 w-36 text-xs'><SelectValue placeholder='Category' /></SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>All categories</SelectItem>
											{Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{isLoadingAll ? (
								<div className='space-y-3'>{[...Array(5)].map((_, i) => <Skeleton key={i} className='h-12 w-full' />)}</div>
							) : allVehicles.length === 0 ? (
								<div className='flex flex-col items-center justify-center py-14 text-center gap-2'>
									<div className='rounded-full bg-muted p-3 mb-1'>
										<IconCar className='h-6 w-6 text-muted-foreground' />
									</div>
									<p className='font-medium'>No vehicles found</p>
									<p className='text-sm text-muted-foreground'>Try adjusting your filters</p>
								</div>
							) : (
								<>
									<div className='rounded-md border overflow-hidden'>
										<Table>
											<TableHeader>
												{allTable.getHeaderGroups().map(hg => (
													<TableRow key={hg.id} className='bg-muted/50'>
														{hg.headers.map(h => <TableHead key={h.id} className='text-xs uppercase tracking-wide font-semibold'>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}
													</TableRow>
												))}
											</TableHeader>
											<TableBody>
												{allTable.getRowModel().rows.map(row => (
													<TableRow key={row.id} className='hover:bg-muted/40'>
														{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
									<PaginationBar meta={allMeta} onPageChange={fetchAll} label='vehicles' />
								</>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* ── Review Dialog ─────────────────────────────────────────────── */}
			<Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle>{reviewAction === 'approve' ? 'Approve Vehicle' : 'Reject Vehicle'}</DialogTitle>
						<DialogDescription>
							{reviewVehicle && `${reviewVehicle.year} ${reviewVehicle.make} ${reviewVehicle.model} — ${reviewVehicle.license_plate}`}
						</DialogDescription>
					</DialogHeader>
					{reviewAction === 'approve' ? (
						<div className='flex items-start gap-3 rounded-lg bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 p-4 text-sm'>
							<IconCheck className='h-5 w-5 text-green-600 shrink-0 mt-0.5' />
							<div>
								<p className='font-medium text-green-800 dark:text-green-200'>Approve this vehicle?</p>
								<p className='text-green-700 dark:text-green-300 mt-1 text-xs'>The driver will be able to go online and accept rides with this vehicle.</p>
							</div>
						</div>
					) : (
						<div className='space-y-3'>
							<div className='flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-4 text-sm'>
								<IconX className='h-5 w-5 text-red-600 shrink-0 mt-0.5' />
								<p className='text-red-800 dark:text-red-200 text-xs'>The driver will be notified and asked to resubmit with corrections.</p>
							</div>
							<div className='space-y-1.5'>
								<Label htmlFor='rej-reason'>Rejection reason <span className='text-destructive'>*</span></Label>
								<Textarea id='rej-reason' placeholder='Explain why this vehicle is being rejected…' rows={3} aria-invalid={!!reviewForm.formState.errors.rejection_reason} {...reviewForm.register('rejection_reason')} />
								{reviewForm.formState.errors.rejection_reason && (
									<p className='text-xs text-destructive'>{reviewForm.formState.errors.rejection_reason.message}</p>
								)}
							</div>
						</div>
					)}
					<DialogFooter>
						<Button variant='outline' onClick={() => setReviewDialogOpen(false)} disabled={reviewForm.formState.isSubmitting}>Cancel</Button>
						<Button variant={reviewAction === 'approve' ? 'default' : 'destructive'} onClick={reviewForm.handleSubmit(onReviewSubmit)} disabled={reviewForm.formState.isSubmitting}>
							{reviewForm.formState.isSubmitting ? 'Submitting…' : reviewAction === 'approve' ? 'Approve Vehicle' : 'Reject Vehicle'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Suspend Dialog ────────────────────────────────────────────── */}
			<AlertDialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Suspend Vehicle</AlertDialogTitle>
						<AlertDialogDescription>
							{suspendVehicle && `${suspendVehicle.year} ${suspendVehicle.make} ${suspendVehicle.model} (${suspendVehicle.license_plate}) will be suspended and the driver won't be able to use it.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className='px-6 pb-2 space-y-1.5'>
						<Label htmlFor='suspend-reason'>Reason <span className='text-destructive'>*</span></Label>
						<Textarea id='suspend-reason' placeholder='Reason for suspension…' rows={3} value={suspendReason} onChange={e => setSuspendReason(e.target.value)} />
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSubmittingSuspend}>Cancel</AlertDialogCancel>
						<AlertDialogAction className='bg-destructive hover:bg-destructive/90' onClick={submitSuspend} disabled={isSubmittingSuspend || !suspendReason.trim()}>
							{isSubmittingSuspend ? 'Suspending…' : 'Suspend Vehicle'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
