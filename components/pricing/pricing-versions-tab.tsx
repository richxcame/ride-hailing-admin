'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { IconPlus, IconEdit, IconCheck, IconArchive, IconCopy } from '@tabler/icons-react';
import { pricingService } from '@/lib/api/pricing.service';
import {
	PricingConfigVersion,
	CreatePricingVersionRequest,
	UpdatePricingVersionRequest,
} from '@/lib/types/pricing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface PricingVersionsTabProps {
	onRefresh?: () => void;
}

type ActionType = 'activate' | 'archive' | 'clone';

export function PricingVersionsTab({ onRefresh }: PricingVersionsTabProps) {
	const [versions, setVersions] = useState<PricingConfigVersion[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [selectedVersion, setSelectedVersion] = useState<PricingConfigVersion | null>(null);
	const [actionDialogOpen, setActionDialogOpen] = useState(false);
	const [actionType, setActionType] = useState<ActionType>('activate');
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Form state
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		effective_from: '',
		effective_until: '',
	});

	const [refreshTick, setRefreshTick] = useState(0);

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const response = await pricingService.getVersions({ limit: 100 });
				if (active) setVersions(response.data);
			} catch (error) {
				if (!active) return;
				const msg = error instanceof Error ? error.message : 'Failed to load versions';
				toast.error('Failed to load versions', { description: msg });
			} finally {
				if (active) setIsLoading(false);
			}
		})();
		return () => {
			active = false;
		};
	}, [refreshTick]);

	const fetchVersions = useCallback(() => {
		setIsLoading(true);
		setRefreshTick((t) => t + 1);
	}, []);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const resetForm = () => {
		setFormData({ name: '', description: '', effective_from: '', effective_until: '' });
	};

	const handleOpenCreate = () => {
		resetForm();
		setCreateDialogOpen(true);
	};

	const handleOpenEdit = (version: PricingConfigVersion) => {
		setSelectedVersion(version);
		setFormData({
			name: version.name,
			description: version.description || '',
			effective_from: version.effective_from
				? new Date(version.effective_from).toISOString().slice(0, 16)
				: '',
			effective_until: version.effective_until
				? new Date(version.effective_until).toISOString().slice(0, 16)
				: '',
		});
		setEditDialogOpen(true);
	};

	const handleOpenAction = (version: PricingConfigVersion, action: ActionType) => {
		setSelectedVersion(version);
		setActionType(action);
		setActionDialogOpen(true);
	};

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			if (!formData.name.trim()) {
				toast.error('Please enter a version name');
				return;
			}

			const payload: CreatePricingVersionRequest = {
				name: formData.name.trim(),
				description: formData.description.trim() || undefined,
				effective_from: formData.effective_from
					? new Date(formData.effective_from).toISOString()
					: undefined,
				effective_until: formData.effective_until
					? new Date(formData.effective_until).toISOString()
					: undefined,
			};

			await pricingService.createVersion(payload);
			toast.success('Version created successfully', { description: payload.name });
			setCreateDialogOpen(false);
			resetForm();
			fetchVersions();
			onRefresh?.();
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Failed to create version';
			toast.error('Failed to create version', { description: msg });
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEdit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedVersion) return;
		setIsSubmitting(true);

		try {
			if (!formData.name.trim()) {
				toast.error('Please enter a version name');
				return;
			}

			const payload: UpdatePricingVersionRequest = {
				name: formData.name.trim(),
				description: formData.description.trim() || undefined,
				effective_from: formData.effective_from
					? new Date(formData.effective_from).toISOString()
					: undefined,
				effective_until: formData.effective_until
					? new Date(formData.effective_until).toISOString()
					: undefined,
			};

			await pricingService.updateVersion(selectedVersion.id, payload);
			toast.success('Version updated successfully', { description: payload.name });
			setEditDialogOpen(false);
			setSelectedVersion(null);
			resetForm();
			fetchVersions();
			onRefresh?.();
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Failed to update version';
			toast.error('Failed to update version', { description: msg });
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleAction = async () => {
		if (!selectedVersion) return;
		setIsSubmitting(true);

		try {
			if (actionType === 'activate') {
				await pricingService.activateVersion(selectedVersion.id);
				toast.success('Version activated', { description: selectedVersion.name });
			} else if (actionType === 'archive') {
				await pricingService.archiveVersion(selectedVersion.id);
				toast.success('Version archived', { description: selectedVersion.name });
			} else if (actionType === 'clone') {
				await pricingService.cloneVersion(selectedVersion.id);
				toast.success('Version cloned', { description: selectedVersion.name });
			}

			setActionDialogOpen(false);
			setSelectedVersion(null);
			fetchVersions();
			onRefresh?.();
		} catch (error) {
			const msg =
				error instanceof Error
					? error.message
					: `Failed to ${actionType} version`;
			toast.error(`Failed to ${actionType} version`, { description: msg });
		} finally {
			setIsSubmitting(false);
		}
	};

	const getStatusBadge = (status: PricingConfigVersion['status']) => {
		switch (status) {
			case 'active':
				return <Badge variant='default'>Active</Badge>;
			case 'draft':
				return <Badge variant='outline' className='border-blue-500 text-blue-600'>Draft</Badge>;
			case 'archived':
				return <Badge variant='secondary'>Archived</Badge>;
			case 'ab_test':
				return <Badge variant='outline' className='border-amber-500 text-amber-600'>A/B Test</Badge>;
			default:
				return <Badge variant='secondary'>{status}</Badge>;
		}
	};

	if (isLoading) {
		return (
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
				{[...Array(3)].map((_, i) => (
					<Skeleton key={i} className='h-48' />
				))}
			</div>
		);
	}

	const renderVersionForm = () => (
		<>
			<div className='space-y-2'>
				<Label htmlFor='form-name'>
					Name <span className='text-destructive'>*</span>
				</Label>
				<Input
					id='form-name'
					placeholder='e.g., Q1 2026 Pricing'
					value={formData.name}
					onChange={(e) => handleInputChange('name', e.target.value)}
					required
				/>
			</div>
			<div className='space-y-2'>
				<Label htmlFor='form-description'>Description</Label>
				<Textarea
					id='form-description'
					placeholder='Optional description for this version'
					value={formData.description}
					onChange={(e) => handleInputChange('description', e.target.value)}
					rows={3}
				/>
			</div>
			<div className='grid grid-cols-2 gap-4'>
				<div className='space-y-2'>
					<Label htmlFor='form-effective-from'>Effective From</Label>
					<Input
						id='form-effective-from'
						type='datetime-local'
						value={formData.effective_from}
						onChange={(e) => handleInputChange('effective_from', e.target.value)}
					/>
				</div>
				<div className='space-y-2'>
					<Label htmlFor='form-effective-until'>Effective Until</Label>
					<Input
						id='form-effective-until'
						type='datetime-local'
						value={formData.effective_until}
						onChange={(e) => handleInputChange('effective_until', e.target.value)}
					/>
				</div>
			</div>
		</>
	);

	return (
		<div className='space-y-4'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h3 className='text-lg font-medium'>Config Versions</h3>
					<p className='text-sm text-muted-foreground'>
						Manage pricing configuration versions and their lifecycle
					</p>
				</div>
				<Button onClick={handleOpenCreate}>
					<IconPlus className='h-4 w-4 mr-2' />
					Add Version
				</Button>
			</div>

			{/* Version Cards Grid */}
			{versions.length === 0 ? (
				<Card>
					<CardContent className='flex flex-col items-center justify-center py-12 text-center'>
						<IconPlus className='h-12 w-12 text-muted-foreground mb-4' />
						<h3 className='text-lg font-semibold'>No Versions Yet</h3>
						<p className='text-sm text-muted-foreground mb-4'>
							Create your first pricing configuration version to get started
						</p>
						<Button onClick={handleOpenCreate}>
							<IconPlus className='h-4 w-4 mr-2' />
							Add Version
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{versions.map((version) => (
						<Card key={version.id}>
							<CardHeader>
								<div className='flex items-start justify-between'>
									<div>
										<CardTitle className='text-lg'>
											{version.name}
											<span className='text-sm font-normal text-muted-foreground ml-2'>
												v{version.version_number}
											</span>
										</CardTitle>
										<CardDescription className='mt-1'>
											{version.description || 'No description'}
										</CardDescription>
									</div>
									{getStatusBadge(version.status)}
								</div>
							</CardHeader>
							<CardContent className='space-y-3'>
								<div className='flex items-center justify-between text-sm'>
									<span className='text-muted-foreground'>Created</span>
									<span className='font-medium'>
										{new Date(version.created_at).toLocaleDateString()}
									</span>
								</div>
								{version.approved_at && (
									<div className='flex items-center justify-between text-sm'>
										<span className='text-muted-foreground'>Approved</span>
										<span className='font-medium'>
											{new Date(version.approved_at).toLocaleDateString()}
										</span>
									</div>
								)}
								{version.effective_from && (
									<div className='flex items-center justify-between text-sm'>
										<span className='text-muted-foreground'>Effective From</span>
										<span className='font-medium'>
											{new Date(version.effective_from).toLocaleDateString()}
										</span>
									</div>
								)}
								{version.effective_until && (
									<div className='flex items-center justify-between text-sm'>
										<span className='text-muted-foreground'>Effective Until</span>
										<span className='font-medium'>
											{new Date(version.effective_until).toLocaleDateString()}
										</span>
									</div>
								)}
								{version.ab_test_percentage !== undefined && version.ab_test_percentage !== null && (
									<div className='flex items-center justify-between text-sm'>
										<span className='text-muted-foreground'>A/B Test %</span>
										<span className='font-medium'>{version.ab_test_percentage}%</span>
									</div>
								)}

								{/* Actions */}
								<div className='flex flex-wrap items-center gap-2 pt-2'>
									<Button
										variant='outline'
										size='sm'
										onClick={() => handleOpenEdit(version)}
									>
										<IconEdit className='h-4 w-4 mr-1' />
										Edit
									</Button>
									<Button
										variant='outline'
										size='sm'
										onClick={() => handleOpenAction(version, 'clone')}
									>
										<IconCopy className='h-4 w-4 mr-1' />
										Clone
									</Button>
									{version.status === 'draft' && (
										<Button
											variant='default'
											size='sm'
											onClick={() => handleOpenAction(version, 'activate')}
										>
											<IconCheck className='h-4 w-4 mr-1' />
											Activate
										</Button>
									)}
									{version.status === 'active' && (
										<Button
											variant='secondary'
											size='sm'
											onClick={() => handleOpenAction(version, 'archive')}
										>
											<IconArchive className='h-4 w-4 mr-1' />
											Archive
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Create Dialog */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle>Create Version</DialogTitle>
						<DialogDescription>
							Create a new pricing configuration version
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleCreate} className='space-y-4'>
						{renderVersionForm()}
						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => setCreateDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isSubmitting}>
								{isSubmitting ? 'Creating...' : 'Create Version'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Edit Dialog */}
			<Dialog
				open={editDialogOpen}
				onOpenChange={(open) => {
					setEditDialogOpen(open);
					if (!open) setSelectedVersion(null);
				}}
			>
				<DialogContent className='max-w-md'>
					<DialogHeader>
						<DialogTitle>Edit Version</DialogTitle>
						<DialogDescription>
							Update version details
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleEdit} className='space-y-4'>
						{renderVersionForm()}
						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => setEditDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isSubmitting}>
								{isSubmitting ? 'Saving...' : 'Save Changes'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Action Confirmation */}
			<AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{actionType === 'activate'
								? 'Activate Version'
								: actionType === 'archive'
									? 'Archive Version'
									: 'Clone Version'}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{actionType === 'activate'
								? `Are you sure you want to activate "${selectedVersion?.name}"? This will deactivate any currently active version and make this version the live pricing configuration.`
								: actionType === 'archive'
									? `Are you sure you want to archive "${selectedVersion?.name}"? This version will no longer be active and cannot be used for pricing.`
									: `Are you sure you want to clone "${selectedVersion?.name}"? A new draft version will be created with the same configuration.`}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleAction}
							disabled={isSubmitting}
						>
							{isSubmitting
								? actionType === 'activate'
									? 'Activating...'
									: actionType === 'archive'
										? 'Archiving...'
										: 'Cloning...'
								: actionType === 'activate'
									? 'Activate'
									: actionType === 'archive'
										? 'Archive'
										: 'Clone'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
