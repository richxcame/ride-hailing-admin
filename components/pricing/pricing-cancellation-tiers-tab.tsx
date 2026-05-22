'use client';

import { useCallback, useEffect, useState } from 'react';
import { IconEdit } from '@tabler/icons-react';
import { toast } from 'sonner';
import { PricingConfig, CancellationFee, CancellationFeeType } from '@/lib/types/pricing';
import { pricingService } from '@/lib/api/pricing.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from '@/components/ui/dialog';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { IconPlus, IconTrash } from '@tabler/icons-react';

interface PricingCancellationTiersTabProps {
	versionId: string;
	onRefresh?: () => void;
}

function formatFeeValue(value: number, type: CancellationFeeType): string {
	if (type === 'percentage') return `${value}%`;
	return `$${value.toFixed(2)}`;
}

function getConfigLevel(config: PricingConfig): string {
	if (config.zone_id) return 'Zone';
	if (config.city_id) return 'City';
	if (config.region_id) return 'Region';
	if (config.country_id) return 'Country';
	return 'Global';
}

function getLocationLabel(config: PricingConfig): string {
	const parts: string[] = [];
	if (config.country_id) parts.push(`Country: ${config.country_id.slice(0, 8)}...`);
	if (config.region_id) parts.push(`Region: ${config.region_id.slice(0, 8)}...`);
	if (config.city_id) parts.push(`City: ${config.city_id.slice(0, 8)}...`);
	if (config.zone_id) parts.push(`Zone: ${config.zone_id.slice(0, 8)}...`);
	return parts.join(' / ') || 'Global';
}

export function PricingCancellationTiersTab({ versionId, onRefresh }: PricingCancellationTiersTabProps) {
	const [configs, setConfigs] = useState<PricingConfig[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Edit dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingConfig, setEditingConfig] = useState<PricingConfig | null>(null);
	const [editingFees, setEditingFees] = useState<CancellationFee[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const [refreshTick, setRefreshTick] = useState(0);

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const response = await pricingService.getConfigs(versionId, { limit: 100 });
				if (active) setConfigs(response.data);
			} catch {
				if (active) toast.error('Failed to load pricing configs');
			} finally {
				if (active) setIsLoading(false);
			}
		})();
		return () => {
			active = false;
		};
	}, [versionId, refreshTick]);

	const fetchData = useCallback(() => {
		setIsLoading(true);
		setRefreshTick((t) => t + 1);
	}, []);

	const handleOpenEdit = (config: PricingConfig) => {
		setEditingConfig(config);
		setEditingFees(config.cancellation_fees ? [...config.cancellation_fees] : []);
		setDialogOpen(true);
	};

	const handleAddTier = () => {
		setEditingFees((prev) => [
			...prev,
			{
				after_minutes: prev.length > 0 ? prev[prev.length - 1].after_minutes + 5 : 0,
				fee: 0,
				fee_type: 'fixed',
			},
		]);
	};

	const handleRemoveTier = (idx: number) => {
		setEditingFees((prev) => prev.filter((_, i) => i !== idx));
	};

	const handleSubmit = async () => {
		if (!editingConfig) return;
		setIsSubmitting(true);
		try {
			await pricingService.updateConfig(editingConfig.id, {
				cancellation_fees: editingFees,
				is_active: editingConfig.is_active,
			});
			toast.success('Cancellation fees updated');
			setDialogOpen(false);
			fetchData();
			onRefresh?.();
		} catch {
			toast.error('Failed to update cancellation fees');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='space-y-4'>
			<div>
				<p className='text-sm text-muted-foreground'>
					Cancellation fees are defined per pricing config. Each config can have tiered cancellation fees based on minutes elapsed.
				</p>
			</div>

			{isLoading ? (
				<div className='space-y-2'>
					{[...Array(5)].map((_, i) => (
						<Skeleton key={i} className='h-12 w-full' />
					))}
				</div>
			) : (
				<div className='rounded-md border'>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Level</TableHead>
								<TableHead>Location</TableHead>
								<TableHead>Cancellation Tiers</TableHead>
								<TableHead>Status</TableHead>
								<TableHead></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{configs.length > 0 ? (
								configs.map((config) => (
									<TableRow key={config.id}>
										<TableCell>
											<Badge variant='outline'>{getConfigLevel(config)}</Badge>
										</TableCell>
										<TableCell>
											<span className='text-sm'>{getLocationLabel(config)}</span>
										</TableCell>
										<TableCell>
											{config.cancellation_fees && config.cancellation_fees.length > 0 ? (
												<div className='space-y-0.5'>
													{config.cancellation_fees.map((tier, idx) => (
														<div key={idx} className='text-xs'>
															After {tier.after_minutes}min:{' '}
															<span className='font-medium'>
																{formatFeeValue(tier.fee, tier.fee_type)}
															</span>
															<span className='text-muted-foreground ml-1'>({tier.fee_type})</span>
														</div>
													))}
												</div>
											) : (
												<span className='text-sm text-muted-foreground italic'>Inherited</span>
											)}
										</TableCell>
										<TableCell>
											<Badge variant={config.is_active ? 'default' : 'secondary'}>
												{config.is_active ? 'Active' : 'Inactive'}
											</Badge>
										</TableCell>
										<TableCell>
											<Button
												variant='ghost'
												size='sm'
												onClick={() => handleOpenEdit(config)}
											>
												<IconEdit className='h-4 w-4' />
											</Button>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={5} className='h-24 text-center'>
										No pricing configs found. Create configs in the Configs tab first.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			)}

			{/* Edit Cancellation Fees Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent size='lg'>
					<DialogHeader>
						<DialogTitle>Edit Cancellation Fees</DialogTitle>
						<DialogDescription>
							{editingConfig
								? `Configure cancellation fee tiers for ${getConfigLevel(editingConfig)} config (${getLocationLabel(editingConfig)})`
								: ''}
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4 py-4'>
						<div className='flex items-center justify-between'>
							<Label className='text-sm font-medium'>Fee Tiers</Label>
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={handleAddTier}
							>
								<IconPlus className='h-3 w-3 mr-1' />
								Add Tier
							</Button>
						</div>
						{editingFees.length === 0 ? (
							<p className='text-sm text-muted-foreground text-center py-4'>
								No tiers defined. Cancellation fees will be inherited from parent config.
							</p>
						) : (
							<div className='space-y-2'>
								{editingFees.map((tier, idx) => (
									<div key={idx} className='flex items-center gap-2 rounded-md border p-2'>
										<div className='flex-1 grid grid-cols-3 gap-2'>
											<div>
												<Label className='text-xs'>After (min)</Label>
												<Input
													type='number'
													min='0'
													value={tier.after_minutes}
													onChange={(e) => {
														const updated = [...editingFees];
														updated[idx] = { ...updated[idx], after_minutes: parseInt(e.target.value) || 0 };
														setEditingFees(updated);
													}}
												/>
											</div>
											<div>
												<Label className='text-xs'>Fee</Label>
												<Input
													type='number'
													step='0.01'
													min='0'
													value={tier.fee}
													onChange={(e) => {
														const updated = [...editingFees];
														updated[idx] = { ...updated[idx], fee: parseFloat(e.target.value) || 0 };
														setEditingFees(updated);
													}}
												/>
											</div>
											<div>
												<Label className='text-xs'>Type</Label>
												<Select
													value={tier.fee_type}
													onValueChange={(v) => {
														const updated = [...editingFees];
														updated[idx] = { ...updated[idx], fee_type: v as CancellationFeeType };
														setEditingFees(updated);
													}}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value='fixed'>Fixed</SelectItem>
														<SelectItem value='percentage'>%</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
										<Button
											type='button'
											variant='ghost'
											size='sm'
											onClick={() => handleRemoveTier(idx)}
										>
											<IconTrash className='h-4 w-4 text-destructive' />
										</Button>
									</div>
								))}
							</div>
						)}
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
							{isSubmitting ? 'Saving...' : 'Save'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
