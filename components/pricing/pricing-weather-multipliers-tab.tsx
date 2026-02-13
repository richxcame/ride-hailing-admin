'use client';

import { useCallback, useEffect, useState } from 'react';
import {
	IconPlus,
	IconEdit,
	IconTrash,
	IconCloudRain,
	IconSnowflake,
	IconCloudStorm,
	IconSun,
	IconCloud,
	IconCloudFog,
	IconDropletHalf2Filled,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { WeatherMultiplier, WeatherCondition } from '@/lib/types/pricing';
import { pricingService } from '@/lib/api/pricing.service';
import { LocationFilter } from '@/components/pricing/location-filter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PricingWeatherMultipliersTabProps {
	versionId: string;
	onRefresh?: () => void;
}

interface FormData {
	weather_condition: WeatherCondition;
	multiplier: number;
	is_active: boolean;
	country_id?: string;
	region_id?: string;
	city_id?: string;
}

const DEFAULT_FORM: FormData = {
	weather_condition: 'rain',
	multiplier: 1.3,
	is_active: true,
};

const WEATHER_ICONS: Record<WeatherCondition, React.ElementType> = {
	clear: IconSun,
	cloudy: IconCloud,
	rain: IconCloudRain,
	heavy_rain: IconDropletHalf2Filled,
	snow: IconSnowflake,
	storm: IconCloudStorm,
	extreme_heat: IconSun,
	fog: IconCloudFog,
};

const WEATHER_LABELS: Record<WeatherCondition, string> = {
	clear: 'Clear',
	cloudy: 'Cloudy',
	rain: 'Rain',
	heavy_rain: 'Heavy Rain',
	snow: 'Snow',
	storm: 'Storm',
	extreme_heat: 'Extreme Heat',
	fog: 'Fog',
};

const WEATHER_COLORS: Record<WeatherCondition, string> = {
	clear: 'text-yellow-500',
	cloudy: 'text-gray-500',
	rain: 'text-blue-500',
	heavy_rain: 'text-blue-700',
	snow: 'text-cyan-500',
	storm: 'text-purple-500',
	extreme_heat: 'text-orange-500',
	fog: 'text-gray-400',
};

export function PricingWeatherMultipliersTab({ versionId, onRefresh }: PricingWeatherMultipliersTabProps) {
	const [data, setData] = useState<WeatherMultiplier[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Filter state
	const [countryId, setCountryId] = useState<string | undefined>();
	const [regionId, setRegionId] = useState<string | undefined>();
	const [cityId, setCityId] = useState<string | undefined>();

	// Dialog state
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editingItem, setEditingItem] = useState<WeatherMultiplier | null>(null);
	const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Delete state
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			const response = await pricingService.getWeatherMultipliers(versionId, {
				limit: 50,
				country_id: countryId,
				region_id: regionId,
				city_id: cityId,
			});
			setData(response.data);
		} catch {
			toast.error('Failed to load weather multipliers');
		} finally {
			setIsLoading(false);
		}
	}, [versionId, countryId, regionId, cityId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const getLocationLabel = (item: WeatherMultiplier): string => {
		if (item.city_id) return `City: ${item.city_id.substring(0, 8)}...`;
		if (item.region_id) return `Region: ${item.region_id.substring(0, 8)}...`;
		if (item.country_id) return `Country: ${item.country_id.substring(0, 8)}...`;
		return 'Global';
	};

	const handleOpenCreate = () => {
		setEditingItem(null);
		setFormData({ ...DEFAULT_FORM, country_id: countryId, region_id: regionId, city_id: cityId });
		setDialogOpen(true);
	};

	const handleOpenEdit = (item: WeatherMultiplier) => {
		setEditingItem(item);
		setFormData({
			weather_condition: item.weather_condition,
			multiplier: item.multiplier,
			is_active: item.is_active,
			country_id: item.country_id,
			region_id: item.region_id,
			city_id: item.city_id,
		});
		setDialogOpen(true);
	};

	const handleSubmit = async () => {
		if (formData.multiplier < 1.0) {
			toast.error('Multiplier must be at least 1.0');
			return;
		}
		setIsSubmitting(true);
		try {
			const payload = {
				...formData,
				version_id: versionId,
			};
			if (editingItem) {
				await pricingService.updateWeatherMultiplier(editingItem.id, payload);
				toast.success('Weather multiplier updated');
			} else {
				await pricingService.createWeatherMultiplier(versionId, payload);
				toast.success('Weather multiplier created');
			}
			setDialogOpen(false);
			fetchData();
			onRefresh?.();
		} catch {
			toast.error(
				editingItem ? 'Failed to update weather multiplier' : 'Failed to create weather multiplier',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!deletingId) return;
		try {
			await pricingService.deleteWeatherMultiplier(deletingId);
			toast.success('Weather multiplier deleted');
			setDeleteDialogOpen(false);
			setDeletingId(null);
			fetchData();
			onRefresh?.();
		} catch {
			toast.error('Failed to delete weather multiplier');
		}
	};

	return (
		<div className='space-y-4'>
			<div className='flex flex-wrap items-end justify-between gap-3'>
				<LocationFilter
					countryId={countryId}
					regionId={regionId}
					cityId={cityId}
					onCountryChange={setCountryId}
					onRegionChange={setRegionId}
					onCityChange={setCityId}
				/>
				<Button onClick={handleOpenCreate}>
					<IconPlus className='mr-2 h-4 w-4' />
					Add Weather Rule
				</Button>
			</div>

			{isLoading ? (
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{[...Array(3)].map((_, i) => (
						<Skeleton key={i} className='h-40 w-full rounded-lg' />
					))}
				</div>
			) : data.length === 0 ? (
				<div className='flex flex-col items-center justify-center py-12 text-center'>
					<IconCloudRain className='h-12 w-12 text-muted-foreground mb-4' />
					<h3 className='text-lg font-semibold'>No weather multipliers found</h3>
					<p className='text-sm text-muted-foreground'>
						Add weather-based pricing rules to adjust fares during different conditions.
					</p>
				</div>
			) : (
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{data.map((item) => {
						const WeatherIcon = WEATHER_ICONS[item.weather_condition];
						const percentChange = Math.round((item.multiplier - 1) * 100);
						return (
							<Card key={item.id}>
								<CardHeader className='pb-3'>
									<div className='flex items-center justify-between'>
										<div className='flex items-center gap-2'>
											<WeatherIcon
												className={`h-5 w-5 ${WEATHER_COLORS[item.weather_condition]}`}
											/>
											<CardTitle className='text-base'>
												{WEATHER_LABELS[item.weather_condition]}
											</CardTitle>
										</div>
										<Badge
											variant={item.is_active ? 'default' : 'secondary'}
										>
											{item.is_active ? 'Active' : 'Inactive'}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className='space-y-3'>
									<div className='text-sm text-muted-foreground'>
										{getLocationLabel(item)}
									</div>
									<div className='text-2xl font-bold'>
										{item.multiplier}x{' '}
										<span className='text-sm font-normal text-muted-foreground'>
											(+{percentChange}%)
										</span>
									</div>
									<div className='flex items-center gap-2 pt-2'>
										<Button
											variant='outline'
											size='sm'
											onClick={() => handleOpenEdit(item)}
										>
											<IconEdit className='mr-1 h-4 w-4' />
											Edit
										</Button>
										<Button
											variant='outline'
											size='sm'
											onClick={() => {
												setDeletingId(item.id);
												setDeleteDialogOpen(true);
											}}
										>
											<IconTrash className='mr-1 h-4 w-4 text-destructive' />
											Delete
										</Button>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			{/* Create/Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingItem ? 'Edit Weather Multiplier' : 'Add Weather Multiplier'}
						</DialogTitle>
						<DialogDescription>
							{editingItem
								? 'Update the weather-based multiplier configuration.'
								: 'Create a new weather-based pricing multiplier.'}
						</DialogDescription>
					</DialogHeader>
					<div className='grid gap-4 py-4'>
						<div className='grid gap-2'>
							<Label htmlFor='weather_condition'>Weather Condition</Label>
							<Select
								value={formData.weather_condition}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										weather_condition: value as WeatherCondition,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder='Select weather condition' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='clear'>Clear</SelectItem>
									<SelectItem value='cloudy'>Cloudy</SelectItem>
									<SelectItem value='rain'>Rain</SelectItem>
									<SelectItem value='heavy_rain'>Heavy Rain</SelectItem>
									<SelectItem value='snow'>Snow</SelectItem>
									<SelectItem value='storm'>Storm</SelectItem>
									<SelectItem value='extreme_heat'>Extreme Heat</SelectItem>
									<SelectItem value='fog'>Fog</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='multiplier'>Multiplier</Label>
							<Input
								id='multiplier'
								type='number'
								step={0.1}
								min={1.0}
								value={formData.multiplier}
								onChange={(e) =>
									setFormData((prev) => ({
										...prev,
										multiplier: parseFloat(e.target.value) || 1.0,
									}))
								}
							/>
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
						<AlertDialogTitle>Delete Weather Multiplier</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this weather multiplier? This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeletingId(null)}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
