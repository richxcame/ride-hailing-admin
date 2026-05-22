'use client';

import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
	IconPlus,
	IconEye,
	IconEdit,
	IconTrash,
	IconDots,
} from '@tabler/icons-react';
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
import { pricingService } from '@/lib/api/pricing.service';
import {
	PricingConfig,
	PricingConfigVersion,
	CancellationFee,
	CreatePricingConfigRequest,
	UpdatePricingConfigRequest,
} from '@/lib/types/pricing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { LocationFilter } from '@/components/pricing/location-filter';
import { InheritanceField } from '@/components/pricing/inheritance-field';
import { Country } from '@/lib/types/geography';

interface PricingConfigsTabProps {
	versionId: string;
	onRefresh?: () => void;
}

function formatCurrency(value: number | null | undefined): string {
	if (value === null || value === undefined) return '--';
	return `$${value.toFixed(2)}`;
}

export function PricingConfigsTab({ versionId, onRefresh }: PricingConfigsTabProps) {
	const [configs, setConfigs] = useState<PricingConfig[]>([]);
	const [versions, setVersions] = useState<PricingConfigVersion[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [pagination, setPagination] = useState({ total: 0, limit: 20, offset: 0 });

	// Filters
	const [filterVersionId, setFilterVersionId] = useState<string | undefined>();
	const [filterCountryId, setFilterCountryId] = useState<string | undefined>();
	const [filterRegionId, setFilterRegionId] = useState<string | undefined>();
	const [filterCityId, setFilterCityId] = useState<string | undefined>();

	// Dialogs
	const [createDialogOpen, setCreateDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [detailSheetOpen, setDetailSheetOpen] = useState(false);
	const [selectedConfig, setSelectedConfig] = useState<PricingConfig | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Form state
	const [formVersionId, setFormVersionId] = useState('');
	const [formCountryId, setFormCountryId] = useState<string | undefined>();
	const [formRegionId, setFormRegionId] = useState<string | undefined>();
	const [formCityId, setFormCityId] = useState<string | undefined>();
	const [formZoneId, setFormZoneId] = useState<string | undefined>();
	const [formIsActive, setFormIsActive] = useState(true);
	const [formCancellationFees, setFormCancellationFees] = useState<CancellationFee[]>([]);
	// Countries (loaded by the form's LocationFilter) so fare inputs can be
	// labelled with the selected country's currency instead of a hardcoded "$".
	const [countries, setCountries] = useState<Country[]>([]);

	// Currency for the config being edited — derived from the selected country.
	// Empty for a global config (no country), where amounts are currency-agnostic.
	const formCurrency =
		countries.find((c) => c.id === formCountryId)?.currency_code ?? '';
	const moneyLabel = (label: string) =>
		formCurrency ? `${label} (${formCurrency})` : label;

	// Override fields pattern: { fieldName: { enabled: boolean, value: string } }
	const [overrides, setOverrides] = useState<
		Record<string, { enabled: boolean; value: string }>
	>({
		base_fare: { enabled: false, value: '' },
		per_km_rate: { enabled: false, value: '' },
		per_minute_rate: { enabled: false, value: '' },
		minimum_fare: { enabled: false, value: '' },
		booking_fee: { enabled: false, value: '' },
		platform_commission_pct: { enabled: false, value: '' },
		driver_incentive_pct: { enabled: false, value: '' },
		surge_min_multiplier: { enabled: false, value: '' },
		surge_max_multiplier: { enabled: false, value: '' },
		tax_rate_pct: { enabled: false, value: '' },
		tax_inclusive: { enabled: false, value: 'false' },
	});

	// Table state
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

	const fetchVersions = useCallback(async () => {
		try {
			const response = await pricingService.getVersions({ limit: 100 });
			setVersions(response.data);
		} catch {
			setVersions([]);
		}
	}, []);

	const fetchConfigs = useCallback(
		async (offset = 0) => {
			try {
				setIsLoading(true);
				const effectiveVersionId = filterVersionId || versionId;
				const params: Record<string, string | number> = {
					limit: pagination.limit,
					offset,
				};

				if (filterCountryId) params.country_id = filterCountryId;
				if (filterRegionId) params.region_id = filterRegionId;
				if (filterCityId) params.city_id = filterCityId;

				const response = await pricingService.getConfigs(effectiveVersionId, params);
				setConfigs(response.data);
				setPagination((prev) => ({ ...prev, total: response.meta.total, offset }));
			} catch (error) {
				const msg = error instanceof Error ? error.message : 'Failed to load configs';
				toast.error('Failed to load configs', { description: msg });
			} finally {
				setIsLoading(false);
			}
		},
		[versionId, pagination.limit, filterVersionId, filterCountryId, filterRegionId, filterCityId]
	);

	useEffect(() => {
		fetchVersions();
	}, [fetchVersions]);

	useEffect(() => {
		fetchConfigs();
	}, [fetchConfigs]);

	const makeOverrides = (enabled: boolean) => ({
		base_fare: { enabled, value: '' },
		per_km_rate: { enabled, value: '' },
		per_minute_rate: { enabled, value: '' },
		minimum_fare: { enabled, value: '' },
		booking_fee: { enabled, value: '' },
		platform_commission_pct: { enabled, value: '' },
		driver_incentive_pct: { enabled, value: '' },
		surge_min_multiplier: { enabled, value: '' },
		surge_max_multiplier: { enabled, value: '' },
		tax_rate_pct: { enabled, value: '' },
		tax_inclusive: { enabled, value: 'false' },
	});

	const resetForm = () => {
		setFormVersionId('');
		setFormCountryId(undefined);
		setFormRegionId(undefined);
		setFormCityId(undefined);
		setFormZoneId(undefined);
		setFormIsActive(true);
		setFormCancellationFees([]);
		setOverrides(makeOverrides(true));
	};

	const populateFormFromConfig = (config: PricingConfig) => {
		setFormVersionId(config.version_id);
		setFormCountryId(config.country_id);
		setFormRegionId(config.region_id);
		setFormCityId(config.city_id);
		setFormZoneId(config.zone_id);
		setFormIsActive(config.is_active);
		setFormCancellationFees(config.cancellation_fees ?? []);

		const numericFields = [
			'base_fare',
			'per_km_rate',
			'per_minute_rate',
			'minimum_fare',
			'booking_fee',
			'platform_commission_pct',
			'driver_incentive_pct',
			'surge_min_multiplier',
			'surge_max_multiplier',
			'tax_rate_pct',
		] as const;

		const newOverrides: Record<string, { enabled: boolean; value: string }> = {};

		for (const field of numericFields) {
			const val = config[field];
			newOverrides[field] = {
				enabled: val !== null && val !== undefined,
				value: val !== null && val !== undefined ? String(val) : '',
			};
		}

		newOverrides.tax_inclusive = {
			enabled: config.tax_inclusive !== null && config.tax_inclusive !== undefined,
			value: config.tax_inclusive !== null && config.tax_inclusive !== undefined
				? String(config.tax_inclusive)
				: 'false',
		};

		setOverrides(newOverrides);
	};

	const handleOpenCreate = () => {
		resetForm();
		setCreateDialogOpen(true);
	};

	const handleOpenEdit = (config: PricingConfig) => {
		setSelectedConfig(config);
		populateFormFromConfig(config);
		setEditDialogOpen(true);
	};

	const handleOpenDelete = (config: PricingConfig) => {
		setSelectedConfig(config);
		setDeleteDialogOpen(true);
	};

	const handleOpenDetail = (config: PricingConfig) => {
		setSelectedConfig(config);
		setDetailSheetOpen(true);
	};

	const buildPayload = (): CreatePricingConfigRequest => {
		const payload: CreatePricingConfigRequest = {
			is_active: formIsActive,
		};

		if (formCountryId) payload.country_id = formCountryId;
		if (formRegionId) payload.region_id = formRegionId;
		if (formCityId) payload.city_id = formCityId;
		if (formZoneId) payload.zone_id = formZoneId;

		const numericFields = [
			'base_fare',
			'per_km_rate',
			'per_minute_rate',
			'minimum_fare',
			'booking_fee',
			'platform_commission_pct',
			'driver_incentive_pct',
			'surge_min_multiplier',
			'surge_max_multiplier',
			'tax_rate_pct',
		] as const;

		for (const field of numericFields) {
			if (overrides[field]?.enabled && overrides[field].value !== '') {
				(payload as unknown as Record<string, unknown>)[field] = parseFloat(overrides[field].value);
			} else {
				(payload as unknown as Record<string, unknown>)[field] = null;
			}
		}

		if (overrides.tax_inclusive?.enabled) {
			payload.tax_inclusive = overrides.tax_inclusive.value === 'true';
		} else {
			payload.tax_inclusive = null;
		}

		if (formCancellationFees.length > 0) {
			payload.cancellation_fees = formCancellationFees;
		}

		return payload;
	};

	const handleCreate = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const effectiveVersionId = formVersionId || versionId;
			const payload = buildPayload();
			await pricingService.createConfig(effectiveVersionId, payload);
			toast.success('Config created successfully');
			setCreateDialogOpen(false);
			resetForm();
			fetchConfigs();
			onRefresh?.();
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Failed to create config';
			toast.error('Failed to create config', { description: msg });
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEdit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedConfig) return;
		setIsSubmitting(true);

		try {
			const payload = buildPayload();
			await pricingService.updateConfig(selectedConfig.id, payload as UpdatePricingConfigRequest);
			toast.success('Config updated successfully');
			setEditDialogOpen(false);
			setSelectedConfig(null);
			resetForm();
			fetchConfigs();
			onRefresh?.();
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Failed to update config';
			toast.error('Failed to update config', { description: msg });
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!selectedConfig) return;
		setIsSubmitting(true);

		try {
			await pricingService.deleteConfig(selectedConfig.id);
			toast.success('Config deleted');
			setDeleteDialogOpen(false);
			setSelectedConfig(null);
			fetchConfigs();
			onRefresh?.();
		} catch (error) {
			const msg = error instanceof Error ? error.message : 'Failed to delete config';
			toast.error('Failed to delete config', { description: msg });
		} finally {
			setIsSubmitting(false);
		}
	};

	const handlePageChange = (newOffset: number) => {
		fetchConfigs(newOffset);
	};

	const getConfigLevel = (config: PricingConfig): string => {
		if (config.zone_id) return 'Zone';
		if (config.city_id) return 'City';
		if (config.region_id) return 'Region';
		if (config.country_id) return 'Country';
		return 'Global';
	};

	const getLocationLabel = (config: PricingConfig): string => {
		const parts: string[] = [];
		if (config.country_id) parts.push(`Country: ${config.country_id.slice(0, 8)}...`);
		if (config.region_id) parts.push(`Region: ${config.region_id.slice(0, 8)}...`);
		if (config.city_id) parts.push(`City: ${config.city_id.slice(0, 8)}...`);
		if (config.zone_id) parts.push(`Zone: ${config.zone_id.slice(0, 8)}...`);
		return parts.join(' / ') || 'Global';
	};

	const toggleOverride = (field: string, enabled: boolean) => {
		setOverrides((prev) => ({
			...prev,
			[field]: { ...prev[field], enabled },
		}));
	};

	const setOverrideValue = (field: string, value: string) => {
		setOverrides((prev) => ({
			...prev,
			[field]: { ...prev[field], value },
		}));
	};

	// Table columns
	const columns: ColumnDef<PricingConfig>[] = [
		{
			id: 'level',
			header: 'Level',
			cell: ({ row }) => (
				<Badge variant='outline'>
					{getConfigLevel(row.original)}
				</Badge>
			),
		},
		{
			id: 'location',
			header: 'Location',
			cell: ({ row }) => (
				<span className='text-sm'>{getLocationLabel(row.original)}</span>
			),
		},
		{
			id: 'key_rates',
			header: 'Key Rates',
			cell: ({ row }) => {
				const config = row.original;
				return (
					<div className='space-y-0.5'>
						<div className='text-xs'>
							Base:{' '}
							{config.base_fare !== null && config.base_fare !== undefined ? (
								<span className='font-medium'>{formatCurrency(config.base_fare)}</span>
							) : (
								<span className='text-muted-foreground italic'>Inherited</span>
							)}
						</div>
						<div className='text-xs'>
							/km:{' '}
							{config.per_km_rate !== null && config.per_km_rate !== undefined ? (
								<span className='font-medium'>{formatCurrency(config.per_km_rate)}</span>
							) : (
								<span className='text-muted-foreground italic'>Inherited</span>
							)}
						</div>
						<div className='text-xs'>
							/min:{' '}
							{config.per_minute_rate !== null && config.per_minute_rate !== undefined ? (
								<span className='font-medium'>{formatCurrency(config.per_minute_rate)}</span>
							) : (
								<span className='text-muted-foreground italic'>Inherited</span>
							)}
						</div>
					</div>
				);
			},
		},
		{
			id: 'commission',
			header: 'Commission %',
			cell: ({ row }) => {
				const config = row.original;
				return config.platform_commission_pct !== null && config.platform_commission_pct !== undefined ? (
					<span className='text-sm font-medium'>{config.platform_commission_pct}%</span>
				) : (
					<span className='text-sm text-muted-foreground italic'>Inherited</span>
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
			id: 'actions',
			cell: ({ row }) => {
				const config = row.original;
				return (
					<div onClick={(e) => e.stopPropagation()}>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' className='h-8 w-8 p-0'>
									<span className='sr-only'>Open menu</span>
									<IconDots className='h-4 w-4' />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DropdownMenuLabel>Actions</DropdownMenuLabel>
								<DropdownMenuItem onClick={() => handleOpenDetail(config)}>
									<IconEye className='mr-2 h-4 w-4' />
									View Details
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => handleOpenEdit(config)}>
									<IconEdit className='mr-2 h-4 w-4' />
									Edit
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className='text-destructive'
									onClick={() => handleOpenDelete(config)}
								>
									<IconTrash className='mr-2 h-4 w-4' />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];

	const table = useReactTable({
		data: configs,
		columns,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
		},
	});

	const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
	const totalPages = Math.ceil(pagination.total / pagination.limit);

	// Renders the override-enabled form field
	const renderOverrideField = (
		field: string,
		label: string,
		type: 'number' | 'boolean' = 'number',
		step = '0.01'
	) => (
		<div className='flex items-start gap-3' key={field}>
			<div className='pt-2'>
				<Checkbox
					id={`override-${field}`}
					checked={overrides[field]?.enabled ?? false}
					onCheckedChange={(checked) => toggleOverride(field, !!checked)}
				/>
			</div>
			<div className='flex-1 space-y-1.5'>
				<Label
					htmlFor={`field-${field}`}
					className={!overrides[field]?.enabled ? 'text-muted-foreground' : ''}
				>
					{label}
				</Label>
				{type === 'boolean' ? (
					<div className='flex items-center gap-2'>
						<Switch
							id={`field-${field}`}
							disabled={!overrides[field]?.enabled}
							checked={overrides[field]?.value === 'true'}
							onCheckedChange={(checked) =>
								setOverrideValue(field, String(checked))
							}
						/>
						<span className='text-sm text-muted-foreground'>
							{!overrides[field]?.enabled
								? 'Inherited'
								: overrides[field]?.value === 'true'
									? 'Yes'
									: 'No'}
						</span>
					</div>
				) : (
					<Input
						id={`field-${field}`}
						type='number'
						step={step}
						min='0'
						placeholder={overrides[field]?.enabled ? '0.00' : 'Inherited'}
						disabled={!overrides[field]?.enabled}
						value={overrides[field]?.enabled ? overrides[field]?.value ?? '' : ''}
						onChange={(e) => setOverrideValue(field, e.target.value)}
					/>
				)}
			</div>
		</div>
	);

	const renderFormFields = () => (
		<>
			{/* Config Info */}
			<div className='space-y-3'>
				<h4 className='font-medium text-sm'>Config Info</h4>
				<div className='grid grid-cols-2 gap-4'>
					<div className='space-y-2'>
						<Label htmlFor='form-version'>
							Version <span className='text-destructive'>*</span>
						</Label>
						<Select value={formVersionId} onValueChange={setFormVersionId}>
							<SelectTrigger id='form-version'>
								<SelectValue placeholder='Select version' />
							</SelectTrigger>
							<SelectContent>
								{versions.map((v) => (
									<SelectItem key={v.id} value={v.id}>
										{v.name} ({v.status})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<LocationFilter
					countryId={formCountryId}
					regionId={formRegionId}
					cityId={formCityId}
					zoneId={formZoneId}
					onCountryChange={setFormCountryId}
					onRegionChange={setFormRegionId}
					onCityChange={setFormCityId}
					onZoneChange={setFormZoneId}
					onCountriesLoaded={setCountries}
					showZone
					layout='horizontal'
				/>
				<p className='text-xs text-muted-foreground'>
					Leave all location fields empty for a global config.
				</p>
			</div>

			<Separator />

			{/* Fare Configuration */}
			<div className='space-y-3'>
				<h4 className='font-medium text-sm'>Fare Configuration</h4>
				<p className='text-xs text-muted-foreground'>
					Check the box to override a field. Unchecked fields inherit from the parent level.
				</p>
				<div className='grid gap-3 sm:grid-cols-2'>
					{renderOverrideField('base_fare', moneyLabel('Base Fare'))}
					{renderOverrideField('per_km_rate', moneyLabel('Per KM Rate'))}
					{renderOverrideField('per_minute_rate', moneyLabel('Per Minute Rate'))}
					{renderOverrideField('minimum_fare', moneyLabel('Minimum Fare'))}
					{renderOverrideField('booking_fee', moneyLabel('Booking Fee'))}
				</div>
			</div>

			<Separator />

			{/* Commission & Incentives */}
			<div className='space-y-3'>
				<h4 className='font-medium text-sm'>Commission & Incentives</h4>
				<div className='grid gap-3 sm:grid-cols-2'>
					{renderOverrideField('platform_commission_pct', 'Platform Commission (%)', 'number', '0.1')}
					{renderOverrideField('driver_incentive_pct', 'Driver Incentive (%)', 'number', '0.1')}
				</div>
			</div>

			<Separator />

			{/* Surge & Tax */}
			<div className='space-y-3'>
				<h4 className='font-medium text-sm'>Surge & Tax</h4>
				<div className='grid gap-3 sm:grid-cols-2'>
					{renderOverrideField('surge_min_multiplier', 'Surge Min Multiplier', 'number', '0.1')}
					{renderOverrideField('surge_max_multiplier', 'Surge Max Multiplier', 'number', '0.1')}
					{renderOverrideField('tax_rate_pct', 'Tax Rate (%)', 'number', '0.1')}
					{renderOverrideField('tax_inclusive', 'Tax Inclusive', 'boolean')}
				</div>
			</div>

			<Separator />

			{/* Cancellation Fees */}
			<div className='space-y-3'>
				<div className='flex items-center justify-between'>
					<h4 className='font-medium text-sm'>Cancellation Fee Tiers</h4>
					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={() =>
							setFormCancellationFees((prev) => [
								...prev,
								{ after_minutes: prev.length > 0 ? (prev[prev.length - 1].after_minutes + 5) : 0, fee: 0, fee_type: 'fixed' },
							])
						}
					>
						<IconPlus className='h-3 w-3 mr-1' />
						Add Tier
					</Button>
				</div>
				{formCancellationFees.length === 0 ? (
					<p className='text-xs text-muted-foreground'>No cancellation fee tiers. Tiers will be inherited from parent.</p>
				) : (
					<div className='space-y-2'>
						{formCancellationFees.map((tier, idx) => (
							<div key={idx} className='flex items-center gap-2 rounded-md border p-2'>
								<div className='flex-1 grid grid-cols-3 gap-2'>
									<div>
										<Label className='text-xs'>After (min)</Label>
										<Input
											type='number'
											min='0'
											value={tier.after_minutes}
											onChange={(e) => {
												const updated = [...formCancellationFees];
												updated[idx] = { ...updated[idx], after_minutes: parseInt(e.target.value) || 0 };
												setFormCancellationFees(updated);
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
												const updated = [...formCancellationFees];
												updated[idx] = { ...updated[idx], fee: parseFloat(e.target.value) || 0 };
												setFormCancellationFees(updated);
											}}
										/>
									</div>
									<div>
										<Label className='text-xs'>Type</Label>
										<Select
											value={tier.fee_type}
											onValueChange={(v) => {
												const updated = [...formCancellationFees];
												updated[idx] = { ...updated[idx], fee_type: v as 'fixed' | 'percentage' };
												setFormCancellationFees(updated);
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
									onClick={() => setFormCancellationFees((prev) => prev.filter((_, i) => i !== idx))}
								>
									<IconTrash className='h-4 w-4 text-destructive' />
								</Button>
							</div>
						))}
					</div>
				)}
			</div>

			<Separator />

			{/* Active */}
			<div className='flex items-center space-x-2'>
				<Switch
					id='form-is-active'
					checked={formIsActive}
					onCheckedChange={setFormIsActive}
				/>
				<Label htmlFor='form-is-active' className='cursor-pointer'>
					Active
				</Label>
			</div>
		</>
	);

	return (
		<div className='space-y-4'>
			{/* Filter Row */}
			<Card>
				<CardHeader className='pb-3'>
					<CardTitle className='text-base'>Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='flex flex-wrap items-end gap-3'>
						<div className='space-y-1.5'>
							<Label className='text-xs text-muted-foreground'>Version</Label>
							<Select
								value={filterVersionId || 'all'}
								onValueChange={(v) => setFilterVersionId(v === 'all' ? undefined : v)}
							>
								<SelectTrigger className='w-[180px]'>
									<SelectValue placeholder='All Versions' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>All Versions</SelectItem>
									{versions.map((v) => (
										<SelectItem key={v.id} value={v.id}>
											{v.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<LocationFilter
							countryId={filterCountryId}
							regionId={filterRegionId}
							cityId={filterCityId}
							onCountryChange={setFilterCountryId}
							onRegionChange={setFilterRegionId}
							onCityChange={setFilterCityId}
						/>

						<Button onClick={handleOpenCreate}>
							<IconPlus className='h-4 w-4 mr-2' />
							Create Config
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Table */}
			<Card>
				<CardHeader>
					<CardTitle>Pricing Configs</CardTitle>
					<CardDescription>
						{isLoading
							? 'Loading configs...'
							: `Showing ${configs.length} of ${pagination.total} configs`}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className='space-y-3'>
							{[...Array(5)].map((_, i) => (
								<div key={i} className='flex items-center gap-4'>
									<div className='space-y-2'>
										<Skeleton className='h-4 w-[250px]' />
										<Skeleton className='h-3 w-[200px]' />
									</div>
								</div>
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
													className='cursor-pointer hover:bg-muted/50'
													onClick={() => handleOpenDetail(row.original)}
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
													No configs found.
												</TableCell>
											</TableRow>
										)}
									</TableBody>
								</Table>
							</div>

							{/* Pagination */}
							<div className='flex items-center justify-between'>
								<div className='text-sm text-muted-foreground'>
									Showing {pagination.offset + 1} to{' '}
									{Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
									{pagination.total} configs
								</div>
								<div className='flex gap-2'>
									<Button
										variant='outline'
										size='sm'
										onClick={() =>
											handlePageChange(
												Math.max(0, pagination.offset - pagination.limit)
											)
										}
										disabled={pagination.offset === 0}
									>
										Previous
									</Button>
									<div className='flex items-center gap-1'>
										<span className='text-sm'>
											Page {currentPage} of {totalPages || 1}
										</span>
									</div>
									<Button
										variant='outline'
										size='sm'
										onClick={() =>
											handlePageChange(pagination.offset + pagination.limit)
										}
										disabled={
											pagination.offset + pagination.limit >= pagination.total
										}
									>
										Next
									</Button>
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Create Dialog */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<DialogContent size='lg'>
					<DialogHeader>
						<DialogTitle>Create Pricing Config</DialogTitle>
						<DialogDescription>
							Create a new pricing configuration. Unchecked fields will inherit values from the parent level.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleCreate} className='space-y-4'>
						{renderFormFields()}
						<DialogFooter>
							<Button
								type='button'
								variant='outline'
								onClick={() => setCreateDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isSubmitting}>
								{isSubmitting ? 'Creating...' : 'Create Config'}
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
					if (!open) setSelectedConfig(null);
				}}
			>
				<DialogContent size='lg'>
					<DialogHeader>
						<DialogTitle>Edit Pricing Config</DialogTitle>
						<DialogDescription>
							Update the pricing configuration. Unchecked fields will inherit values from the parent level.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleEdit} className='space-y-4'>
						{renderFormFields()}
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

			{/* Delete Confirmation */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Pricing Config</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this pricing config? This action cannot be
							undone. Any child configs relying on this config for inheritance may be
							affected.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isSubmitting}
							variant='default'
						>
							{isSubmitting ? 'Deleting...' : 'Delete'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Detail Sheet */}
			<Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
				<SheetContent className='flex flex-col sm:max-w-lg'>
					<SheetHeader>
						<SheetTitle>Config Details</SheetTitle>
						<SheetDescription>
							{selectedConfig ? `${getConfigLevel(selectedConfig)} level config` : ''}
						</SheetDescription>
					</SheetHeader>
					{selectedConfig && (
						<div className='flex-1 overflow-y-auto'>
						<div className='space-y-4 px-4 pb-6'>
							<div className='flex items-center gap-2'>
								<Badge variant='outline'>
									{getConfigLevel(selectedConfig)}
								</Badge>
								<Badge
									variant={selectedConfig.is_active ? 'default' : 'secondary'}
								>
									{selectedConfig.is_active ? 'Active' : 'Inactive'}
								</Badge>
							</div>

							<Separator />

							<div className='space-y-1'>
								<h4 className='text-sm font-medium'>Fare Configuration</h4>
								<InheritanceField label='Base Fare' value={selectedConfig.base_fare} type='currency' />
								<InheritanceField label='Per KM Rate' value={selectedConfig.per_km_rate} type='currency' />
								<InheritanceField label='Per Minute Rate' value={selectedConfig.per_minute_rate} type='currency' />
								<InheritanceField label='Minimum Fare' value={selectedConfig.minimum_fare} type='currency' />
								<InheritanceField label='Booking Fee' value={selectedConfig.booking_fee} type='currency' />
							</div>

							<Separator />

							<div className='space-y-1'>
								<h4 className='text-sm font-medium'>Commission & Incentives</h4>
								<InheritanceField label='Platform Commission' value={selectedConfig.platform_commission_pct} type='percentage' />
								<InheritanceField label='Driver Incentive' value={selectedConfig.driver_incentive_pct} type='percentage' />
							</div>

							<Separator />

							<div className='space-y-1'>
								<h4 className='text-sm font-medium'>Surge & Tax</h4>
								<InheritanceField label='Surge Min Multiplier' value={selectedConfig.surge_min_multiplier} type='multiplier' />
								<InheritanceField label='Surge Max Multiplier' value={selectedConfig.surge_max_multiplier} type='multiplier' />
								<InheritanceField label='Tax Rate' value={selectedConfig.tax_rate_pct} type='percentage' />
								<InheritanceField label='Tax Inclusive' value={selectedConfig.tax_inclusive} type='boolean' />
							</div>

							<Separator />

							<div className='space-y-1'>
								<h4 className='text-sm font-medium'>Cancellation Fee Tiers</h4>
								{selectedConfig.cancellation_fees && selectedConfig.cancellation_fees.length > 0 ? (
									<div className='space-y-1'>
										{selectedConfig.cancellation_fees.map((tier, idx) => (
											<div key={idx} className='flex items-center justify-between text-sm'>
												<span className='text-muted-foreground'>After {tier.after_minutes} min</span>
												<span className='font-medium'>
													{tier.fee_type === 'percentage' ? `${tier.fee}%` : `$${tier.fee.toFixed(2)}`}
													<span className='text-xs text-muted-foreground ml-1'>({tier.fee_type})</span>
												</span>
											</div>
										))}
									</div>
								) : (
									<p className='text-sm text-muted-foreground'>Inherited</p>
								)}
							</div>

							<Separator />

							<div className='space-y-1 text-sm text-muted-foreground'>
								<p>
									Created: {new Date(selectedConfig.created_at).toLocaleString()}
								</p>
								<p>
									Updated: {new Date(selectedConfig.updated_at).toLocaleString()}
								</p>
							</div>

							<div className='flex gap-2 pt-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => {
										setDetailSheetOpen(false);
										handleOpenEdit(selectedConfig);
									}}
								>
									<IconEdit className='h-4 w-4 mr-1' />
									Edit
								</Button>
								<Button
									variant='outline'
									size='sm'
									className='text-destructive'
									onClick={() => {
										setDetailSheetOpen(false);
										handleOpenDelete(selectedConfig);
									}}
								>
									<IconTrash className='h-4 w-4 mr-1' />
									Delete
								</Button>
							</div>
						</div>
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	);
}
