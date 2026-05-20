'use client';

import { useCallback, useEffect, useState } from 'react';
import {
	IconSettings,
	IconPercentage,
	IconCar,
	IconCreditCard,
	IconBell,
	IconUsers,
	IconShield,
	IconToggleLeft,
	IconDeviceFloppy,
	IconLoader2,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { settingsService } from '@/lib/api/settings.service';
import { AppSetting, SettingCategory } from '@/lib/types/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CATEGORIES: {
	value: SettingCategory;
	label: string;
	icon: React.ElementType;
}[] = [
	{ value: 'general', label: 'General', icon: IconSettings },
	{ value: 'commission', label: 'Commission', icon: IconPercentage },
	{ value: 'rides', label: 'Rides', icon: IconCar },
	{ value: 'payments', label: 'Payments', icon: IconCreditCard },
	{ value: 'notifications', label: 'Notifications', icon: IconBell },
	{ value: 'referrals', label: 'Referrals', icon: IconUsers },
	{ value: 'safety', label: 'Safety', icon: IconShield },
	{ value: 'feature_flags', label: 'Feature Flags', icon: IconToggleLeft },
];

function formatJsonValue(value: string): string {
	try {
		return JSON.stringify(JSON.parse(value), null, 2);
	} catch {
		return value;
	}
}

function SettingsSkeleton() {
	return (
		<div className='space-y-6'>
			{[...Array(3)].map((_, i) => (
				<div key={i} className='flex items-center justify-between gap-8'>
					<div className='flex-1 space-y-2'>
						<Skeleton className='h-5 w-40' />
						<Skeleton className='h-4 w-64' />
					</div>
					<Skeleton className='h-9 w-48' />
				</div>
			))}
		</div>
	);
}

export default function SettingsPage() {
	const [settings, setSettings] = useState<AppSetting[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [modifiedSettings, setModifiedSettings] = useState<Record<string, string>>({});

	useEffect(() => {
		let active = true;
		(async () => {
			try {
				const data = await settingsService.getSettings();
				if (!active) return;
				setSettings(data);
				setModifiedSettings({});
			} catch {
				if (active) toast.error('Failed to load settings');
			} finally {
				if (active) setIsLoading(false);
			}
		})();
		return () => {
			active = false;
		};
	}, []);

	const handleValueChange = useCallback(
		(key: string, newValue: string) => {
			const original = settings.find((s) => s.key === key);
			if (!original) return;

			setModifiedSettings((prev) => {
				const next = { ...prev };
				if (newValue === original.value) {
					delete next[key];
				} else {
					next[key] = newValue;
				}
				return next;
			});
		},
		[settings],
	);

	const handleBooleanChange = useCallback(
		(key: string, checked: boolean) => {
			handleValueChange(key, checked ? 'true' : 'false');
		},
		[handleValueChange],
	);

	const handleSave = useCallback(async () => {
		const keys = Object.keys(modifiedSettings);
		if (keys.length === 0) return;

		try {
			setIsSaving(true);
			const updatedSettings = await settingsService.bulkUpdateSettings({
				settings: keys.map((key) => ({
					key,
					value: modifiedSettings[key],
				})),
			});

			setSettings((prev) =>
				prev.map((s) => {
					const updated = updatedSettings.find((u) => u.key === s.key);
					return updated ?? s;
				}),
			);
			setModifiedSettings({});
			toast.success(`Successfully saved ${keys.length} setting${keys.length > 1 ? 's' : ''}`);
		} catch {
			toast.error('Failed to save settings');
		} finally {
			setIsSaving(false);
		}
	}, [modifiedSettings]);

	const getDisplayValue = useCallback(
		(setting: AppSetting): string => {
			if (setting.key in modifiedSettings) {
				return modifiedSettings[setting.key];
			}
			return setting.value;
		},
		[modifiedSettings],
	);

	const getSettingsByCategory = useCallback(
		(category: SettingCategory): AppSetting[] => {
			return settings.filter((s) => s.category === category);
		},
		[settings],
	);

	const unsavedCount = Object.keys(modifiedSettings).length;

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Settings</h1>
					<p className='text-sm text-muted-foreground'>
						Configure application settings and feature flags
					</p>
				</div>
				<div className='flex items-center gap-3'>
					{unsavedCount > 0 && (
						<Badge variant='secondary'>
							{unsavedCount} unsaved change{unsavedCount > 1 ? 's' : ''}
						</Badge>
					)}
					<Button
						size='sm'
						onClick={handleSave}
						disabled={unsavedCount === 0 || isSaving}
					>
						{isSaving ? (
							<IconLoader2 className='h-4 w-4 animate-spin' />
						) : (
							<IconDeviceFloppy className='h-4 w-4' />
						)}
						{isSaving ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</div>

			{/* Category Tabs */}
			<Tabs defaultValue='general' className='space-y-4'>
				<TabsList className='overflow-x-auto'>
					{CATEGORIES.map((cat) => {
						const Icon = cat.icon;
						return (
							<TabsTrigger key={cat.value} value={cat.value}>
								<Icon className='h-4 w-4 mr-1.5' />
								{cat.label}
							</TabsTrigger>
						);
					})}
				</TabsList>

				{CATEGORIES.map((cat) => {
					const Icon = cat.icon;
					const categorySettings = getSettingsByCategory(cat.value);

					return (
						<TabsContent key={cat.value} value={cat.value}>
							<Card>
								<CardHeader>
									<div className='flex items-center gap-2'>
										<Icon className='h-5 w-5 text-muted-foreground' />
										<CardTitle>{cat.label}</CardTitle>
									</div>
									<CardDescription>
										Manage {cat.label.toLowerCase()} settings for the application
									</CardDescription>
								</CardHeader>
								<CardContent>
									{isLoading ? (
										<SettingsSkeleton />
									) : categorySettings.length === 0 ? (
										<div className='flex flex-col items-center justify-center py-12 text-center'>
											<Icon className='h-12 w-12 text-muted-foreground mb-4' />
											<h3 className='text-lg font-semibold'>No settings found</h3>
											<p className='text-sm text-muted-foreground'>
												There are no {cat.label.toLowerCase()} settings configured yet.
											</p>
										</div>
									) : (
										<div className='space-y-0'>
											{categorySettings.map((setting, index) => {
												const currentValue = getDisplayValue(setting);
												const isModified = setting.key in modifiedSettings;

												return (
													<div key={setting.id}>
														{index > 0 && <Separator className='my-4' />}
														<div className='flex items-start justify-between gap-8'>
															<div className='flex-1 min-w-0 space-y-1'>
																<div className='flex items-center gap-2'>
																	<Label className='text-sm font-semibold'>
																		{setting.label}
																	</Label>
																	{isModified && (
																		<Badge variant='outline' className='text-xs'>
																			Modified
																		</Badge>
																	)}
																	{!setting.is_editable && (
																		<Badge variant='secondary' className='text-xs'>
																			Read-only
																		</Badge>
																	)}
																</div>
																{setting.description && (
																	<p className='text-sm text-muted-foreground'>
																		{setting.description}
																	</p>
																)}
																{setting.updated_by && (
																	<p className='text-xs text-muted-foreground'>
																		Last updated by {setting.updated_by}
																	</p>
																)}
															</div>
															<div className='shrink-0 w-64'>
																{setting.type === 'boolean' ? (
																	<div className='flex items-center justify-end h-9'>
																		<Switch
																			checked={currentValue === 'true'}
																			onCheckedChange={(checked) =>
																				handleBooleanChange(setting.key, checked)
																			}
																			disabled={!setting.is_editable}
																		/>
																	</div>
																) : setting.type === 'number' ? (
																	<Input
																		type='number'
																		value={currentValue}
																		onChange={(e) =>
																			handleValueChange(setting.key, e.target.value)
																		}
																		disabled={!setting.is_editable}
																	/>
																) : setting.type === 'json' ? (
																	<Textarea
																		value={
																			isModified
																				? currentValue
																				: formatJsonValue(currentValue)
																		}
																		onChange={(e) =>
																			handleValueChange(setting.key, e.target.value)
																		}
																		disabled={!setting.is_editable}
																		rows={4}
																		className='font-mono text-xs'
																	/>
																) : (
																	<Input
																		type='text'
																		value={currentValue}
																		onChange={(e) =>
																			handleValueChange(setting.key, e.target.value)
																		}
																		disabled={!setting.is_editable}
																	/>
																)}
															</div>
														</div>
													</div>
												);
											})}
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>
					);
				})}
			</Tabs>
		</div>
	);
}
