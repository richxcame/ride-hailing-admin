'use client';

import { useState } from 'react';
import {
	IconAlertTriangle,
	IconCopy,
	IconUser,
	IconClock,
	IconShieldCheck,
	IconId,
	IconX,
	IconExternalLink,
	IconFileText,
	IconShield,
} from '@tabler/icons-react';
import { FraudAlert } from '@/lib/types/models';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetFooter,
} from '@/components/ui/sheet';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface FraudAlertDetailSheetProps {
	alert: FraudAlert | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onInvestigate?: (alertId: string, notes?: string) => Promise<void>;
	onResolve?: (
		alertId: string,
		status: 'confirmed' | 'false_positive',
		actionTaken?: string,
		notes?: string
	) => Promise<void>;
}

const getLevelColor = (level: string) => {
	const colors = {
		low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
		medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
		high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
		critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
	};
	return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getStatusColor = (status: string) => {
	const colors = {
		pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
		investigating: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
		confirmed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
		false_positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
		resolved: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
	};
	return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

const getAlertTypeLabel = (type: string) => {
	const labels: Record<string, string> = {
		payment_fraud: 'Payment Fraud',
		account_fraud: 'Account Fraud',
		location_fraud: 'Location Fraud',
		ride_fraud: 'Ride Fraud',
		rating_manipulation: 'Rating Manipulation',
		promo_abuse: 'Promo Abuse',
	};
	return labels[type] || type;
};

export function FraudAlertDetailSheet({
	alert,
	open,
	onOpenChange,
	onInvestigate,
	onResolve,
}: FraudAlertDetailSheetProps) {
	const [showResolveDialog, setShowResolveDialog] = useState(false);
	const [showInvestigateDialog, setShowInvestigateDialog] = useState(false);
	const [resolveStatus, setResolveStatus] = useState<'confirmed' | 'false_positive'>('confirmed');
	const [actionTaken, setActionTaken] = useState('');
	const [notes, setNotes] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	if (!alert) return null;

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const formatTime = (dateString: string) => {
		return new Date(dateString).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const handleCopyId = () => {
		navigator.clipboard.writeText(alert.id);
		toast.success('Alert ID copied to clipboard');
	};

	const handleCopyUserId = () => {
		navigator.clipboard.writeText(alert.user_id);
		toast.success('User ID copied to clipboard');
	};

	const handleInvestigate = async () => {
		if (!onInvestigate) return;

		try {
			setIsLoading(true);
			await onInvestigate(alert.id, notes);
			setShowInvestigateDialog(false);
			setNotes('');
			toast.success('Alert marked as investigating');
		} catch (error) {
			toast.error('Failed to update alert');
		} finally {
			setIsLoading(false);
		}
	};

	const handleResolve = async () => {
		if (!onResolve) return;

		try {
			setIsLoading(true);
			await onResolve(alert.id, resolveStatus, actionTaken, notes);
			setShowResolveDialog(false);
			setActionTaken('');
			setNotes('');
			toast.success(`Alert marked as ${resolveStatus === 'confirmed' ? 'confirmed fraud' : 'false positive'}`);
		} catch (error) {
			toast.error('Failed to resolve alert');
		} finally {
			setIsLoading(false);
		}
	};

	const user = alert.user;
	const userInitials = user
		? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
		: 'U';

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent className='w-full sm:max-w-xl overflow-y-auto'>
					<SheetHeader>
						<SheetTitle className='flex items-center gap-2'>
							<IconAlertTriangle className='h-5 w-5' />
							Fraud Alert Details
						</SheetTitle>
						<SheetDescription>
							Complete information about this fraud alert and investigation status
						</SheetDescription>
					</SheetHeader>

					<div className='space-y-6 py-6'>
						{/* Alert ID & Status */}
						<div className='space-y-3'>
							<div className='flex items-center gap-2 text-sm text-muted-foreground'>
								<IconId className='h-4 w-4' />
								<span className='font-mono text-xs'>{alert.id}</span>
								<Button variant='ghost' size='sm' onClick={handleCopyId} className='h-6 w-6 p-0'>
									<IconCopy className='h-3 w-3' />
								</Button>
							</div>

							<div className='flex items-center gap-2'>
								<Badge variant='secondary' className={getStatusColor(alert.status)}>
									{alert.status.replace('_', ' ').toUpperCase()}
								</Badge>
								<Badge variant='secondary' className={getLevelColor(alert.alert_level)}>
									{alert.alert_level.toUpperCase()}
								</Badge>
								<Badge variant='outline'>{getAlertTypeLabel(alert.alert_type)}</Badge>
							</div>
						</div>

						<Separator />

						{/* User Information */}
						<div className='space-y-3'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<IconUser className='h-4 w-4 text-muted-foreground' />
									<span className='text-sm font-medium'>User Information</span>
								</div>
								{user && (
									<Button
										variant='ghost'
										size='sm'
										onClick={() => (window.location.href = `/dashboard/users/${alert.user_id}`)}
									>
										<IconExternalLink className='h-4 w-4' />
									</Button>
								)}
							</div>

							{user ? (
								<div className='flex items-center gap-3 rounded-md border p-3'>
									<Avatar className='h-10 w-10'>
										<AvatarImage src={user.profile_image} alt={`${user.first_name} ${user.last_name}`} />
										<AvatarFallback>{userInitials}</AvatarFallback>
									</Avatar>
									<div className='flex-1 min-w-0'>
										<p className='text-sm font-medium truncate'>
											{user.first_name} {user.last_name}
										</p>
										<p className='text-xs text-muted-foreground truncate'>{user.email}</p>
										<p className='text-xs text-muted-foreground'>{user.phone_number}</p>
									</div>
									<Button
										variant='ghost'
										size='sm'
										onClick={handleCopyUserId}
										className='h-8 w-8 p-0 shrink-0'
									>
										<IconCopy className='h-3 w-3' />
									</Button>
								</div>
							) : (
								<p className='text-sm text-muted-foreground'>User information not available</p>
							)}
						</div>

						<Separator />

						{/* Risk Score */}
						<div className='space-y-3'>
							<div className='flex items-center gap-2'>
								<IconShield className='h-4 w-4 text-muted-foreground' />
								<span className='text-sm font-medium'>Risk Score</span>
							</div>
							<div className='flex items-center gap-4'>
								<div className='text-3xl font-bold text-red-600'>{alert.risk_score}</div>
								<div className='flex-1'>
									<div className='h-2 w-full bg-gray-200 rounded-full overflow-hidden'>
										<div
											className={`h-full ${
												alert.risk_score >= 90
													? 'bg-red-600'
													: alert.risk_score >= 70
													? 'bg-orange-600'
													: alert.risk_score >= 50
													? 'bg-yellow-600'
													: 'bg-blue-600'
											}`}
											style={{ width: `${alert.risk_score}%` }}
										/>
									</div>
									<p className='text-xs text-muted-foreground mt-1'>
										{alert.risk_score >= 90
											? 'Critical risk - Immediate action required'
											: alert.risk_score >= 70
											? 'High risk - Review recommended'
											: alert.risk_score >= 50
											? 'Medium risk - Monitor closely'
											: 'Low risk'}
									</p>
								</div>
							</div>
						</div>

						<Separator />

						{/* Description */}
						<div className='space-y-3'>
							<div className='flex items-center gap-2'>
								<IconFileText className='h-4 w-4 text-muted-foreground' />
								<span className='text-sm font-medium'>Description</span>
							</div>
							<p className='text-sm text-muted-foreground'>{alert.description}</p>
						</div>

						{/* Details */}
						{alert.details && Object.keys(alert.details).length > 0 && (
							<>
								<Separator />
								<div className='space-y-3'>
									<span className='text-sm font-medium'>Additional Details</span>
									<div className='rounded-md bg-muted p-3'>
										<pre className='text-xs overflow-x-auto'>{JSON.stringify(alert.details, null, 2)}</pre>
									</div>
								</div>
							</>
						)}

						<Separator />

						{/* Timeline */}
						<div className='space-y-3'>
							<div className='flex items-center gap-2'>
								<IconClock className='h-4 w-4 text-muted-foreground' />
								<span className='text-sm font-medium'>Timeline</span>
							</div>

							<div className='space-y-2 text-sm'>
								<div className='flex justify-between'>
									<span className='text-muted-foreground'>Detected</span>
									<span className='font-medium'>
										{formatDate(alert.detected_at)} {formatTime(alert.detected_at)}
									</span>
								</div>

								{alert.investigated_at && (
									<div className='flex justify-between'>
										<span className='text-muted-foreground'>Investigation Started</span>
										<span className='font-medium'>
											{formatDate(alert.investigated_at)} {formatTime(alert.investigated_at)}
										</span>
									</div>
								)}

								{alert.resolved_at && (
									<div className='flex justify-between'>
										<span className='text-muted-foreground'>Resolved</span>
										<span className='font-medium'>
											{formatDate(alert.resolved_at)} {formatTime(alert.resolved_at)}
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Notes & Action */}
						{(alert.notes || alert.action_taken) && (
							<>
								<Separator />
								<div className='space-y-3'>
									{alert.notes && (
										<div>
											<span className='text-sm font-medium'>Investigation Notes</span>
											<p className='text-sm text-muted-foreground mt-1'>{alert.notes}</p>
										</div>
									)}
									{alert.action_taken && (
										<div>
											<span className='text-sm font-medium'>Action Taken</span>
											<p className='text-sm text-muted-foreground mt-1'>{alert.action_taken}</p>
										</div>
									)}
								</div>
							</>
						)}
					</div>

					<SheetFooter className='flex-col sm:flex-row gap-2'>
						{alert.status === 'pending' && (
							<Button variant='outline' onClick={() => setShowInvestigateDialog(true)} className='w-full sm:w-auto'>
								<IconAlertTriangle className='mr-2 h-4 w-4' />
								Start Investigation
							</Button>
						)}
						{(alert.status === 'pending' || alert.status === 'investigating') && (
							<Button onClick={() => setShowResolveDialog(true)} className='w-full sm:w-auto'>
								<IconShieldCheck className='mr-2 h-4 w-4' />
								Resolve Alert
							</Button>
						)}
					</SheetFooter>
				</SheetContent>
			</Sheet>

			{/* Investigate Dialog */}
			<AlertDialog open={showInvestigateDialog} onOpenChange={setShowInvestigateDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Start Investigation</AlertDialogTitle>
						<AlertDialogDescription>
							Mark this alert as under investigation. You can add notes about the investigation process.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<Label htmlFor='investigate-notes'>Investigation Notes (Optional)</Label>
							<Textarea
								id='investigate-notes'
								placeholder='Add any initial notes or observations...'
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								rows={4}
							/>
						</div>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleInvestigate} disabled={isLoading}>
							{isLoading ? 'Updating...' : 'Start Investigation'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Resolve Dialog */}
			<AlertDialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Resolve Fraud Alert</AlertDialogTitle>
						<AlertDialogDescription>
							Conclude the investigation by confirming the fraud or marking it as a false positive.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className='space-y-4 py-4'>
						<div className='space-y-2'>
							<Label htmlFor='resolve-status'>Resolution Status</Label>
							<Select value={resolveStatus} onValueChange={(v) => setResolveStatus(v as typeof resolveStatus)}>
								<SelectTrigger id='resolve-status'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='confirmed'>Confirmed Fraud</SelectItem>
									<SelectItem value='false_positive'>False Positive</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='action-taken'>Action Taken (Optional)</Label>
							<Textarea
								id='action-taken'
								placeholder='Describe the action taken (e.g., Account suspended, Warning sent)...'
								value={actionTaken}
								onChange={(e) => setActionTaken(e.target.value)}
								rows={3}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='resolution-notes'>Resolution Notes (Optional)</Label>
							<Textarea
								id='resolution-notes'
								placeholder='Add any final notes or conclusions...'
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								rows={4}
							/>
						</div>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleResolve} disabled={isLoading}>
							{isLoading ? 'Resolving...' : 'Resolve Alert'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
