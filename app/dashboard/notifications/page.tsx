'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import {
	IconBell,
	IconPlus,
	IconRefresh,
	IconSend,
	IconClock,
	IconCheck,
	IconX,
	IconTrash,
	IconEdit,
	IconTemplate,
	IconMail,
	IconMessageCircle,
	IconDeviceMobile,
	IconChevronUp,
	IconChevronDown,
	IconDots,
	IconUsers,
} from '@tabler/icons-react';
import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table';
import { notificationService } from '@/lib/api/notification.service';
import type {
	NotificationCampaign,
	NotificationTemplate,
	NotificationLog,
	NotificationChannel,
	CampaignStatus,
	AudienceSegment,
} from '@/lib/types/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

// ==================== Helpers ====================

const channelIcon = (channel: NotificationChannel) => {
	switch (channel) {
		case 'push':
			return <IconDeviceMobile className='h-3.5 w-3.5' />;
		case 'sms':
			return <IconMessageCircle className='h-3.5 w-3.5' />;
		case 'email':
			return <IconMail className='h-3.5 w-3.5' />;
	}
};

const channelLabel = (channel: NotificationChannel) => {
	switch (channel) {
		case 'push':
			return 'Push';
		case 'sms':
			return 'SMS';
		case 'email':
			return 'Email';
	}
};

const audienceLabel = (audience: AudienceSegment) => {
	const labels: Record<AudienceSegment, string> = {
		all_riders: 'All Riders',
		all_drivers: 'All Drivers',
		active_riders: 'Active Riders',
		active_drivers: 'Active Drivers',
		inactive_users: 'Inactive Users',
		custom: 'Custom',
	};
	return labels[audience] || audience;
};

const campaignStatusVariant = (status: CampaignStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
	switch (status) {
		case 'sent':
			return 'default';
		case 'failed':
			return 'destructive';
		case 'draft':
		case 'cancelled':
			return 'secondary';
		case 'scheduled':
		case 'sending':
			return 'outline';
		default:
			return 'secondary';
	}
};

const campaignStatusColor = (status: CampaignStatus) => {
	switch (status) {
		case 'draft':
			return '';
		case 'scheduled':
			return 'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400';
		case 'sending':
			return 'border-yellow-300 text-yellow-700 dark:border-yellow-700 dark:text-yellow-400';
		case 'sent':
			return 'bg-green-600 text-white';
		case 'failed':
			return '';
		case 'cancelled':
			return '';
		default:
			return '';
	}
};

const logStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
	switch (status) {
		case 'delivered':
		case 'opened':
			return 'default';
		case 'failed':
			return 'destructive';
		case 'pending':
			return 'secondary';
		case 'sent':
			return 'outline';
		default:
			return 'secondary';
	}
};

const logStatusColor = (status: string) => {
	switch (status) {
		case 'delivered':
			return 'bg-green-600 text-white';
		case 'opened':
			return 'bg-blue-600 text-white';
		case 'sent':
			return 'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400';
		case 'pending':
			return '';
		case 'failed':
			return '';
		default:
			return '';
	}
};

const formatDate = (dateStr?: string) => {
	if (!dateStr) return '-';
	const date = new Date(dateStr);
	return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

// ==================== Campaign Action Cell ====================

function CampaignActionCell({
	campaign,
	onSend,
	onCancel,
	onDelete,
}: {
	campaign: NotificationCampaign;
	onSend: (id: string) => void;
	onCancel: (id: string) => void;
	onDelete: (id: string) => void;
}) {
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
				{campaign.status === 'draft' && (
					<>
						<DropdownMenuItem onSelect={() => onSend(campaign.id)}>
							<IconSend className='mr-2 h-4 w-4' />
							Send Now
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onSelect={() => onDelete(campaign.id)}
							className='text-destructive'
						>
							<IconTrash className='mr-2 h-4 w-4' />
							Delete
						</DropdownMenuItem>
					</>
				)}
				{campaign.status === 'scheduled' && (
					<DropdownMenuItem onSelect={() => onCancel(campaign.id)}>
						<IconX className='mr-2 h-4 w-4' />
						Cancel
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ==================== Template Action Cell ====================

function TemplateActionCell({
	template,
	onEdit,
	onDelete,
}: {
	template: NotificationTemplate;
	onEdit: (template: NotificationTemplate) => void;
	onDelete: (id: string) => void;
}) {
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
				<DropdownMenuItem onSelect={() => onEdit(template)}>
					<IconEdit className='mr-2 h-4 w-4' />
					Edit
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onSelect={() => onDelete(template.id)}
					className='text-destructive'
				>
					<IconTrash className='mr-2 h-4 w-4' />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// ==================== Main Page ====================

export default function NotificationsPage() {
	// === Campaigns state ===
	const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
	const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
	const [campaignPagination, setCampaignPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});
	const [campaignSorting, setCampaignSorting] = useState<SortingState>([]);

	// Create campaign dialog
	const [showCreateCampaign, setShowCreateCampaign] = useState(false);
	const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
	const [campaignForm, setCampaignForm] = useState({
		name: '',
		title: '',
		message: '',
		channel: 'push' as NotificationChannel,
		audience: 'all_riders' as AudienceSegment,
		scheduled_at: '',
	});

	// Campaign action dialogs
	const [sendCampaignId, setSendCampaignId] = useState<string | null>(null);
	const [cancelCampaignId, setCancelCampaignId] = useState<string | null>(null);
	const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);

	// === Templates state ===
	const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
	const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
	const [templatePagination, setTemplatePagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});
	const [templateSorting, setTemplateSorting] = useState<SortingState>([]);

	// Create/Edit template dialog
	const [showTemplateDialog, setShowTemplateDialog] = useState(false);
	const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
	const [isSavingTemplate, setIsSavingTemplate] = useState(false);
	const [templateForm, setTemplateForm] = useState({
		name: '',
		title: '',
		message: '',
		channel: 'push' as NotificationChannel,
		is_active: true,
	});
	const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

	// === Logs state ===
	const [logs, setLogs] = useState<NotificationLog[]>([]);
	const [isLoadingLogs, setIsLoadingLogs] = useState(true);
	const [logPagination, setLogPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});
	const [logSorting, setLogSorting] = useState<SortingState>([]);
	const [logFilters, setLogFilters] = useState({
		channel: '',
		status: '',
	});

	// ==================== Fetch Functions ====================

	const fetchCampaigns = useCallback(async () => {
		try {
			setIsLoadingCampaigns(true);
			const response = await notificationService.getCampaigns({
				limit: campaignPagination.limit,
				offset: campaignPagination.offset,
			});
			setCampaigns(response.data);
			setCampaignPagination((prev) => ({ ...prev, total: response.meta.total }));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load campaigns';
			toast.error('Failed to load campaigns', { description: errorMessage });
		} finally {
			setIsLoadingCampaigns(false);
		}
	}, [campaignPagination.limit, campaignPagination.offset]);

	const fetchTemplates = useCallback(async () => {
		try {
			setIsLoadingTemplates(true);
			const response = await notificationService.getTemplates({
				limit: templatePagination.limit,
				offset: templatePagination.offset,
			});
			setTemplates(response.data);
			setTemplatePagination((prev) => ({ ...prev, total: response.meta.total }));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load templates';
			toast.error('Failed to load templates', { description: errorMessage });
		} finally {
			setIsLoadingTemplates(false);
		}
	}, [templatePagination.limit, templatePagination.offset]);

	const fetchLogs = useCallback(async () => {
		try {
			setIsLoadingLogs(true);
			const params: Record<string, string | number> = {
				limit: logPagination.limit,
				offset: logPagination.offset,
			};
			if (logFilters.channel && logFilters.channel !== 'all') params.channel = logFilters.channel;
			if (logFilters.status && logFilters.status !== 'all') params.status = logFilters.status;

			const response = await notificationService.getLogs(params);
			setLogs(response.data);
			setLogPagination((prev) => ({ ...prev, total: response.meta.total }));
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to load logs';
			toast.error('Failed to load delivery logs', { description: errorMessage });
		} finally {
			setIsLoadingLogs(false);
		}
	}, [logPagination.limit, logPagination.offset, logFilters]);

	useEffect(() => {
		fetchCampaigns();
	}, [fetchCampaigns]);

	useEffect(() => {
		fetchTemplates();
	}, [fetchTemplates]);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	// ==================== Campaign Actions ====================

	const handleCreateCampaign = async () => {
		if (!campaignForm.name.trim() || !campaignForm.title.trim() || !campaignForm.message.trim()) {
			toast.error('Please fill in all required fields');
			return;
		}
		try {
			setIsCreatingCampaign(true);
			await notificationService.createCampaign({
				name: campaignForm.name,
				title: campaignForm.title,
				message: campaignForm.message,
				channel: campaignForm.channel,
				audience: campaignForm.audience,
				...(campaignForm.scheduled_at && { scheduled_at: new Date(campaignForm.scheduled_at).toISOString() }),
			});
			toast.success('Campaign created successfully');
			setShowCreateCampaign(false);
			setCampaignForm({
				name: '',
				title: '',
				message: '',
				channel: 'push',
				audience: 'all_riders',
				scheduled_at: '',
			});
			fetchCampaigns();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to create campaign';
			toast.error('Failed to create campaign', { description: errorMessage });
		} finally {
			setIsCreatingCampaign(false);
		}
	};

	const handleSendCampaign = async () => {
		if (!sendCampaignId) return;
		try {
			await notificationService.sendCampaign(sendCampaignId);
			toast.success('Campaign sent successfully');
			setSendCampaignId(null);
			fetchCampaigns();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to send campaign';
			toast.error('Failed to send campaign', { description: errorMessage });
		}
	};

	const handleCancelCampaign = async () => {
		if (!cancelCampaignId) return;
		try {
			await notificationService.cancelCampaign(cancelCampaignId);
			toast.success('Campaign cancelled');
			setCancelCampaignId(null);
			fetchCampaigns();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to cancel campaign';
			toast.error('Failed to cancel campaign', { description: errorMessage });
		}
	};

	const handleDeleteCampaign = async () => {
		if (!deleteCampaignId) return;
		try {
			await notificationService.deleteCampaign(deleteCampaignId);
			toast.success('Campaign deleted');
			setDeleteCampaignId(null);
			fetchCampaigns();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to delete campaign';
			toast.error('Failed to delete campaign', { description: errorMessage });
		}
	};

	// ==================== Template Actions ====================

	const openCreateTemplate = () => {
		setEditingTemplate(null);
		setTemplateForm({
			name: '',
			title: '',
			message: '',
			channel: 'push',
			is_active: true,
		});
		setShowTemplateDialog(true);
	};

	const openEditTemplate = (template: NotificationTemplate) => {
		setEditingTemplate(template);
		setTemplateForm({
			name: template.name,
			title: template.title,
			message: template.message,
			channel: template.channel,
			is_active: template.is_active,
		});
		setShowTemplateDialog(true);
	};

	const handleSaveTemplate = async () => {
		if (!templateForm.name.trim() || !templateForm.title.trim() || !templateForm.message.trim()) {
			toast.error('Please fill in all required fields');
			return;
		}
		try {
			setIsSavingTemplate(true);
			if (editingTemplate) {
				await notificationService.updateTemplate(editingTemplate.id, {
					name: templateForm.name,
					title: templateForm.title,
					message: templateForm.message,
					channel: templateForm.channel,
					is_active: templateForm.is_active,
				});
				toast.success('Template updated successfully');
			} else {
				await notificationService.createTemplate({
					name: templateForm.name,
					title: templateForm.title,
					message: templateForm.message,
					channel: templateForm.channel,
					is_active: templateForm.is_active,
				});
				toast.success('Template created successfully');
			}
			setShowTemplateDialog(false);
			setEditingTemplate(null);
			fetchTemplates();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to save template';
			toast.error('Failed to save template', { description: errorMessage });
		} finally {
			setIsSavingTemplate(false);
		}
	};

	const handleDeleteTemplate = async () => {
		if (!deleteTemplateId) return;
		try {
			await notificationService.deleteTemplate(deleteTemplateId);
			toast.success('Template deleted');
			setDeleteTemplateId(null);
			fetchTemplates();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
			toast.error('Failed to delete template', { description: errorMessage });
		}
	};

	// ==================== Computed Stats ====================

	const campaignStats = useMemo(() => {
		const total = campaignPagination.total;
		const activeSending = campaigns.filter((c) => c.status === 'sending').length;
		const scheduled = campaigns.filter((c) => c.status === 'scheduled').length;
		const totalSent = campaigns.reduce((sum, c) => sum + c.total_sent, 0);
		return { total, activeSending, scheduled, totalSent };
	}, [campaigns, campaignPagination.total]);

	// ==================== Campaign Columns ====================

	const campaignColumns = useMemo<ColumnDef<NotificationCampaign>[]>(
		() => [
			{
				accessorKey: 'name',
				header: 'Name',
				cell: ({ row }) => (
					<div className='flex flex-col'>
						<span className='text-sm font-medium'>{row.original.name}</span>
						<span className='text-xs text-muted-foreground truncate max-w-48'>
							{row.original.title}
						</span>
					</div>
				),
			},
			{
				accessorKey: 'channel',
				header: 'Channel',
				cell: ({ row }) => {
					const channel = row.original.channel;
					return (
						<Badge variant='outline' className='gap-1'>
							{channelIcon(channel)}
							{channelLabel(channel)}
						</Badge>
					);
				},
			},
			{
				accessorKey: 'audience',
				header: 'Audience',
				cell: ({ row }) => (
					<div className='flex items-center gap-1.5 text-sm'>
						<IconUsers className='h-3.5 w-3.5 text-muted-foreground' />
						{audienceLabel(row.original.audience)}
						{row.original.audience_count != null && (
							<span className='text-xs text-muted-foreground'>
								({row.original.audience_count.toLocaleString()})
							</span>
						)}
					</div>
				),
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ row }) => {
					const status = row.original.status;
					return (
						<Badge
							variant={campaignStatusVariant(status)}
							className={campaignStatusColor(status)}
						>
							{status.charAt(0).toUpperCase() + status.slice(1)}
						</Badge>
					);
				},
			},
			{
				id: 'delivery',
				header: 'Sent / Delivered / Failed',
				cell: ({ row }) => {
					const c = row.original;
					return (
						<div className='flex items-center gap-2 text-xs'>
							<span className='text-muted-foreground'>{c.total_sent.toLocaleString()}</span>
							<span className='text-muted-foreground'>/</span>
							<span className='text-green-600'>{c.total_delivered.toLocaleString()}</span>
							<span className='text-muted-foreground'>/</span>
							<span className='text-red-600'>{c.total_failed.toLocaleString()}</span>
						</div>
					);
				},
			},
			{
				accessorKey: 'created_at',
				header: 'Created',
				cell: ({ row }) => (
					<div className='text-sm text-muted-foreground'>
						{formatDate(row.original.created_at)}
					</div>
				),
			},
			{
				id: 'actions',
				cell: ({ row }) => (
					<CampaignActionCell
						campaign={row.original}
						onSend={setSendCampaignId}
						onCancel={setCancelCampaignId}
						onDelete={setDeleteCampaignId}
					/>
				),
			},
		],
		[],
	);

	// ==================== Template Columns ====================

	const templateColumns = useMemo<ColumnDef<NotificationTemplate>[]>(
		() => [
			{
				accessorKey: 'name',
				header: 'Name',
				cell: ({ row }) => (
					<span className='text-sm font-medium'>{row.original.name}</span>
				),
			},
			{
				accessorKey: 'title',
				header: 'Title',
				cell: ({ row }) => (
					<div className='text-sm text-muted-foreground truncate max-w-48'>
						{row.original.title}
					</div>
				),
			},
			{
				accessorKey: 'channel',
				header: 'Channel',
				cell: ({ row }) => {
					const channel = row.original.channel;
					return (
						<Badge variant='outline' className='gap-1'>
							{channelIcon(channel)}
							{channelLabel(channel)}
						</Badge>
					);
				},
			},
			{
				accessorKey: 'is_active',
				header: 'Active',
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
					<div className='text-sm text-muted-foreground'>
						{formatDate(row.original.created_at)}
					</div>
				),
			},
			{
				id: 'actions',
				cell: ({ row }) => (
					<TemplateActionCell
						template={row.original}
						onEdit={openEditTemplate}
						onDelete={setDeleteTemplateId}
					/>
				),
			},
		],
		[],
	);

	// ==================== Log Columns ====================

	const logColumns = useMemo<ColumnDef<NotificationLog>[]>(
		() => [
			{
				accessorKey: 'user_name',
				header: 'User',
				cell: ({ row }) => (
					<div className='flex flex-col'>
						<span className='text-sm font-medium'>
							{row.original.user_name || 'Unknown'}
						</span>
						<span className='text-xs text-muted-foreground font-mono truncate max-w-24'>
							{row.original.user_id.substring(0, 8)}...
						</span>
					</div>
				),
			},
			{
				accessorKey: 'title',
				header: 'Title',
				cell: ({ row }) => (
					<div className='text-sm truncate max-w-40' title={row.original.title}>
						{row.original.title}
					</div>
				),
			},
			{
				accessorKey: 'channel',
				header: 'Channel',
				cell: ({ row }) => {
					const channel = row.original.channel;
					return (
						<Badge variant='outline' className='gap-1'>
							{channelIcon(channel)}
							{channelLabel(channel)}
						</Badge>
					);
				},
			},
			{
				accessorKey: 'status',
				header: 'Status',
				cell: ({ row }) => {
					const status = row.original.status;
					return (
						<Badge
							variant={logStatusVariant(status)}
							className={logStatusColor(status)}
						>
							{status.charAt(0).toUpperCase() + status.slice(1)}
						</Badge>
					);
				},
			},
			{
				accessorKey: 'sent_at',
				header: 'Sent At',
				cell: ({ row }) => (
					<div className='text-sm text-muted-foreground'>
						{formatDate(row.original.sent_at)}
					</div>
				),
			},
			{
				accessorKey: 'delivered_at',
				header: 'Delivered At',
				cell: ({ row }) => (
					<div className='text-sm text-muted-foreground'>
						{formatDate(row.original.delivered_at)}
					</div>
				),
			},
			{
				accessorKey: 'failure_reason',
				header: 'Failure Reason',
				cell: ({ row }) => {
					const reason = row.original.failure_reason;
					if (!reason) return <span className='text-sm text-muted-foreground'>-</span>;
					return (
						<div
							className='text-sm text-destructive truncate max-w-40'
							title={reason}
						>
							{reason}
						</div>
					);
				},
			},
			{
				accessorKey: 'created_at',
				header: 'Created',
				cell: ({ row }) => (
					<div className='text-sm text-muted-foreground'>
						{formatDate(row.original.created_at)}
					</div>
				),
			},
		],
		[],
	);

	// ==================== Table Instances ====================

	const campaignTable = useReactTable({
		data: campaigns,
		columns: campaignColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setCampaignSorting,
		state: { sorting: campaignSorting },
	});

	const templateTable = useReactTable({
		data: templates,
		columns: templateColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setTemplateSorting,
		state: { sorting: templateSorting },
	});

	const logTable = useReactTable({
		data: logs,
		columns: logColumns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setLogSorting,
		state: { sorting: logSorting },
	});

	// ==================== Pagination Helpers ====================

	const campaignTotalPages = Math.ceil(campaignPagination.total / campaignPagination.limit);
	const campaignCurrentPage = Math.floor(campaignPagination.offset / campaignPagination.limit) + 1;

	const templateTotalPages = Math.ceil(templatePagination.total / templatePagination.limit);
	const templateCurrentPage = Math.floor(templatePagination.offset / templatePagination.limit) + 1;

	const logTotalPages = Math.ceil(logPagination.total / logPagination.limit);
	const logCurrentPage = Math.floor(logPagination.offset / logPagination.limit) + 1;

	// ==================== Refresh ====================

	const handleRefresh = () => {
		fetchCampaigns();
		fetchTemplates();
		fetchLogs();
		toast.success('Notifications data refreshed');
	};

	// ==================== Render Helpers ====================

	const renderTableContent = <T,>(
		table: ReturnType<typeof useReactTable<T>>,
		isLoading: boolean,
		emptyIcon: React.ReactNode,
		emptyTitle: string,
		emptyDescription: string,
	) => {
		if (isLoading) {
			return (
				<div className='space-y-2'>
					{[...Array(5)].map((_, i) => (
						<Skeleton key={i} className='h-14 w-full' />
					))}
				</div>
			);
		}

		if (table.getRowModel().rows.length === 0) {
			return (
				<div className='flex flex-col items-center justify-center py-12 text-center'>
					{emptyIcon}
					<h3 className='text-lg font-semibold'>{emptyTitle}</h3>
					<p className='text-sm text-muted-foreground'>{emptyDescription}</p>
				</div>
			);
		}

		return (
			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder ? null : (
											<div
												className={
													header.column.getCanSort()
														? 'flex items-center gap-2 cursor-pointer'
														: ''
												}
												onClick={header.column.getToggleSortingHandler()}
											>
												{flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
												{header.column.getCanSort() && (
													<div className='flex flex-col'>
														<IconChevronUp className='h-3 w-3' />
														<IconChevronDown className='h-3 w-3 -mt-1' />
													</div>
												)}
											</div>
										)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
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
						))}
					</TableBody>
				</Table>
			</div>
		);
	};

	const renderPagination = (
		pagination: { total: number; limit: number; offset: number },
		currentPage: number,
		totalPages: number,
		onPageChange: (offset: number) => void,
		label: string,
	) => {
		if (totalPages <= 1) return null;
		return (
			<div className='flex items-center justify-between'>
				<p className='text-sm text-muted-foreground'>
					Showing {pagination.offset + 1} to{' '}
					{Math.min(pagination.offset + pagination.limit, pagination.total)}{' '}
					of {pagination.total} {label}
				</p>
				<div className='flex items-center gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={() => onPageChange(pagination.offset - pagination.limit)}
						disabled={currentPage === 1}
					>
						Previous
					</Button>
					<span className='text-sm'>
						Page {currentPage} of {totalPages}
					</span>
					<Button
						variant='outline'
						size='sm'
						onClick={() => onPageChange(pagination.offset + pagination.limit)}
						disabled={currentPage === totalPages}
					>
						Next
					</Button>
				</div>
			</div>
		);
	};

	// ==================== Page Render ====================

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Notifications</h1>
					<p className='text-sm text-muted-foreground'>
						Manage campaigns, templates, and delivery logs
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<Button variant='outline' size='sm' onClick={handleRefresh}>
						<IconRefresh className='h-4 w-4' />
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconBell className='h-4 w-4' />
							Total Campaigns
						</CardDescription>
						{isLoadingCampaigns ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl'>{campaignStats.total}</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>All notification campaigns</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconSend className='h-4 w-4 text-yellow-600' />
							Active / Sending
						</CardDescription>
						{isLoadingCampaigns ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-yellow-600'>
								{campaignStats.activeSending}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Currently sending</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconClock className='h-4 w-4 text-blue-600' />
							Scheduled
						</CardDescription>
						{isLoadingCampaigns ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-blue-600'>
								{campaignStats.scheduled}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Pending delivery</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='pb-2'>
						<CardDescription className='flex items-center gap-2'>
							<IconCheck className='h-4 w-4 text-green-600' />
							Total Sent
						</CardDescription>
						{isLoadingCampaigns ? (
							<Skeleton className='h-8 w-20' />
						) : (
							<CardTitle className='text-3xl text-green-600'>
								{campaignStats.totalSent.toLocaleString()}
							</CardTitle>
						)}
					</CardHeader>
					<CardContent>
						<p className='text-xs text-muted-foreground'>Notifications dispatched</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue='campaigns' className='space-y-4'>
				<TabsList>
					<TabsTrigger value='campaigns'>
						<IconBell className='h-4 w-4 mr-1.5' />
						Campaigns
					</TabsTrigger>
					<TabsTrigger value='templates'>
						<IconTemplate className='h-4 w-4 mr-1.5' />
						Templates
					</TabsTrigger>
					<TabsTrigger value='logs'>
						<IconMail className='h-4 w-4 mr-1.5' />
						Delivery Logs
					</TabsTrigger>
				</TabsList>

				{/* ==================== Campaigns Tab ==================== */}
				<TabsContent value='campaigns' className='space-y-4'>
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<div>
									<CardTitle>Campaigns</CardTitle>
									<CardDescription>
										{isLoadingCampaigns
											? 'Loading campaigns...'
											: `${campaignPagination.total} total campaigns`}
									</CardDescription>
								</div>
								<Button size='sm' onClick={() => setShowCreateCampaign(true)}>
									<IconPlus className='h-4 w-4 mr-2' />
									Create Campaign
								</Button>
							</div>
						</CardHeader>
						<CardContent className='space-y-4'>
							{renderTableContent(
								campaignTable,
								isLoadingCampaigns,
								<IconBell className='h-12 w-12 text-muted-foreground mb-4' />,
								'No campaigns yet',
								'Create your first notification campaign to get started.',
							)}
							{renderPagination(
								campaignPagination,
								campaignCurrentPage,
								campaignTotalPages,
								(offset) => setCampaignPagination((prev) => ({ ...prev, offset })),
								'campaigns',
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ==================== Templates Tab ==================== */}
				<TabsContent value='templates' className='space-y-4'>
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<div>
									<CardTitle>Templates</CardTitle>
									<CardDescription>
										{isLoadingTemplates
											? 'Loading templates...'
											: `${templatePagination.total} total templates`}
									</CardDescription>
								</div>
								<Button size='sm' onClick={openCreateTemplate}>
									<IconPlus className='h-4 w-4 mr-2' />
									Create Template
								</Button>
							</div>
						</CardHeader>
						<CardContent className='space-y-4'>
							{renderTableContent(
								templateTable,
								isLoadingTemplates,
								<IconTemplate className='h-12 w-12 text-muted-foreground mb-4' />,
								'No templates yet',
								'Create reusable notification templates.',
							)}
							{renderPagination(
								templatePagination,
								templateCurrentPage,
								templateTotalPages,
								(offset) => setTemplatePagination((prev) => ({ ...prev, offset })),
								'templates',
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* ==================== Delivery Logs Tab ==================== */}
				<TabsContent value='logs' className='space-y-4'>
					<Card>
						<CardHeader>
							<div className='flex items-center justify-between'>
								<div>
									<CardTitle>Delivery Logs</CardTitle>
									<CardDescription>
										{isLoadingLogs
											? 'Loading logs...'
											: `${logPagination.total} total log entries`}
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className='space-y-4'>
							{/* Filters */}
							<div className='flex flex-col sm:flex-row gap-3'>
								<div className='space-y-1'>
									<Label className='text-xs text-muted-foreground'>Channel</Label>
									<Select
										value={logFilters.channel}
										onValueChange={(value) => {
											setLogFilters((prev) => ({ ...prev, channel: value }));
											setLogPagination((prev) => ({ ...prev, offset: 0 }));
										}}
									>
										<SelectTrigger className='w-[150px]'>
											<SelectValue placeholder='All channels' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>All Channels</SelectItem>
											<SelectItem value='push'>Push</SelectItem>
											<SelectItem value='sms'>SMS</SelectItem>
											<SelectItem value='email'>Email</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className='space-y-1'>
									<Label className='text-xs text-muted-foreground'>Status</Label>
									<Select
										value={logFilters.status}
										onValueChange={(value) => {
											setLogFilters((prev) => ({ ...prev, status: value }));
											setLogPagination((prev) => ({ ...prev, offset: 0 }));
										}}
									>
										<SelectTrigger className='w-[150px]'>
											<SelectValue placeholder='All statuses' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='all'>All Statuses</SelectItem>
											<SelectItem value='pending'>Pending</SelectItem>
											<SelectItem value='sent'>Sent</SelectItem>
											<SelectItem value='delivered'>Delivered</SelectItem>
											<SelectItem value='failed'>Failed</SelectItem>
											<SelectItem value='opened'>Opened</SelectItem>
										</SelectContent>
									</Select>
								</div>
								{(logFilters.channel && logFilters.channel !== 'all') ||
								(logFilters.status && logFilters.status !== 'all') ? (
									<div className='flex items-end'>
										<Button
											variant='outline'
											size='sm'
											onClick={() => {
												setLogFilters({ channel: '', status: '' });
												setLogPagination((prev) => ({ ...prev, offset: 0 }));
											}}
										>
											Clear Filters
										</Button>
									</div>
								) : null}
							</div>

							{renderTableContent(
								logTable,
								isLoadingLogs,
								<IconMail className='h-12 w-12 text-muted-foreground mb-4' />,
								'No delivery logs found',
								'Notification delivery logs will appear here.',
							)}
							{renderPagination(
								logPagination,
								logCurrentPage,
								logTotalPages,
								(offset) => setLogPagination((prev) => ({ ...prev, offset })),
								'entries',
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* ==================== Create Campaign Dialog ==================== */}
			<Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
				<DialogContent className='sm:max-w-lg'>
					<DialogHeader>
						<DialogTitle>Create Campaign</DialogTitle>
						<DialogDescription>
							Create a new notification campaign to reach your users.
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='campaign-name'>Name</Label>
							<Input
								id='campaign-name'
								placeholder='Campaign name'
								value={campaignForm.name}
								onChange={(e) =>
									setCampaignForm((prev) => ({ ...prev, name: e.target.value }))
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='campaign-title'>Title</Label>
							<Input
								id='campaign-title'
								placeholder='Notification title'
								value={campaignForm.title}
								onChange={(e) =>
									setCampaignForm((prev) => ({ ...prev, title: e.target.value }))
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='campaign-message'>Message</Label>
							<Textarea
								id='campaign-message'
								placeholder='Notification message content...'
								value={campaignForm.message}
								onChange={(e) =>
									setCampaignForm((prev) => ({ ...prev, message: e.target.value }))
								}
								rows={4}
							/>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label>Channel</Label>
								<Select
									value={campaignForm.channel}
									onValueChange={(value) =>
										setCampaignForm((prev) => ({
											...prev,
											channel: value as NotificationChannel,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='push'>Push</SelectItem>
										<SelectItem value='sms'>SMS</SelectItem>
										<SelectItem value='email'>Email</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className='space-y-2'>
								<Label>Audience</Label>
								<Select
									value={campaignForm.audience}
									onValueChange={(value) =>
										setCampaignForm((prev) => ({
											...prev,
											audience: value as AudienceSegment,
										}))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='all_riders'>All Riders</SelectItem>
										<SelectItem value='all_drivers'>All Drivers</SelectItem>
										<SelectItem value='active_riders'>Active Riders</SelectItem>
										<SelectItem value='active_drivers'>Active Drivers</SelectItem>
										<SelectItem value='inactive_users'>Inactive Users</SelectItem>
										<SelectItem value='custom'>Custom</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='campaign-scheduled'>Schedule (optional)</Label>
							<Input
								id='campaign-scheduled'
								type='datetime-local'
								value={campaignForm.scheduled_at}
								onChange={(e) =>
									setCampaignForm((prev) => ({
										...prev,
										scheduled_at: e.target.value,
									}))
								}
							/>
							<p className='text-xs text-muted-foreground'>
								Leave empty to save as draft. Set a date to schedule delivery.
							</p>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setShowCreateCampaign(false)}
							disabled={isCreatingCampaign}
						>
							Cancel
						</Button>
						<Button onClick={handleCreateCampaign} disabled={isCreatingCampaign}>
							{isCreatingCampaign ? 'Creating...' : 'Create Campaign'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ==================== Create/Edit Template Dialog ==================== */}
			<Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
				<DialogContent className='sm:max-w-lg'>
					<DialogHeader>
						<DialogTitle>
							{editingTemplate ? 'Edit Template' : 'Create Template'}
						</DialogTitle>
						<DialogDescription>
							{editingTemplate
								? 'Update the notification template details.'
								: 'Create a reusable notification template.'}
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='template-name'>Name</Label>
							<Input
								id='template-name'
								placeholder='Template name'
								value={templateForm.name}
								onChange={(e) =>
									setTemplateForm((prev) => ({ ...prev, name: e.target.value }))
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='template-title'>Title</Label>
							<Input
								id='template-title'
								placeholder='Notification title'
								value={templateForm.title}
								onChange={(e) =>
									setTemplateForm((prev) => ({ ...prev, title: e.target.value }))
								}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='template-message'>Message</Label>
							<Textarea
								id='template-message'
								placeholder='Notification message content...'
								value={templateForm.message}
								onChange={(e) =>
									setTemplateForm((prev) => ({
										...prev,
										message: e.target.value,
									}))
								}
								rows={4}
							/>
						</div>
						<div className='space-y-2'>
							<Label>Channel</Label>
							<Select
								value={templateForm.channel}
								onValueChange={(value) =>
									setTemplateForm((prev) => ({
										...prev,
										channel: value as NotificationChannel,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='push'>Push</SelectItem>
									<SelectItem value='sms'>SMS</SelectItem>
									<SelectItem value='email'>Email</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className='flex items-center gap-3'>
							<Switch
								id='template-active'
								checked={templateForm.is_active}
								onCheckedChange={(checked) =>
									setTemplateForm((prev) => ({
										...prev,
										is_active: checked,
									}))
								}
							/>
							<Label htmlFor='template-active'>Active</Label>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setShowTemplateDialog(false)}
							disabled={isSavingTemplate}
						>
							Cancel
						</Button>
						<Button onClick={handleSaveTemplate} disabled={isSavingTemplate}>
							{isSavingTemplate
								? 'Saving...'
								: editingTemplate
									? 'Update Template'
									: 'Create Template'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ==================== Send Campaign Confirmation ==================== */}
			<AlertDialog open={!!sendCampaignId} onOpenChange={() => setSendCampaignId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<IconSend className='h-5 w-5 text-blue-600' />
							Send Campaign
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to send this campaign now? This will deliver
							notifications to all users in the target audience.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleSendCampaign}>
							Send Now
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* ==================== Cancel Campaign Confirmation ==================== */}
			<AlertDialog open={!!cancelCampaignId} onOpenChange={() => setCancelCampaignId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<IconX className='h-5 w-5 text-destructive' />
							Cancel Campaign
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to cancel this scheduled campaign? This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Keep Scheduled</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleCancelCampaign}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							Cancel Campaign
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* ==================== Delete Campaign Confirmation ==================== */}
			<AlertDialog open={!!deleteCampaignId} onOpenChange={() => setDeleteCampaignId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<IconTrash className='h-5 w-5 text-destructive' />
							Delete Campaign
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this campaign? This action cannot be
							undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteCampaign}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* ==================== Delete Template Confirmation ==================== */}
			<AlertDialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle className='flex items-center gap-2'>
							<IconTrash className='h-5 w-5 text-destructive' />
							Delete Template
						</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this template? This action cannot be
							undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteTemplate}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
