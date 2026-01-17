'use client';

import {
	IconMail,
	IconPhone,
	IconCalendar,
	IconUserCheck,
	IconUserOff,
	IconShield,
	IconId,
	IconCopy,
} from '@tabler/icons-react';
import { User } from '@/lib/types/models';
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
import { toast } from 'sonner';

interface UserDetailSheetProps {
	user: User | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuspend: () => void;
	onActivate: () => void;
}

export function UserDetailSheet({
	user,
	open,
	onOpenChange,
	onSuspend,
	onActivate,
}: UserDetailSheetProps) {
	if (!user) return null;

	const roleColors = {
		admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
		driver: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
		rider: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	const copyToClipboard = (text: string, label: string) => {
		navigator.clipboard.writeText(text);
		toast.success(`${label} copied to clipboard`);
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='flex flex-col'>
				<SheetHeader>
					<SheetTitle>User Details</SheetTitle>
					<SheetDescription>View and manage user information</SheetDescription>
				</SheetHeader>

				<div className='flex-1 overflow-y-auto'>
					<div className='space-y-6 px-4 pb-6'>
						{/* User Avatar & Basic Info */}
						<div className='flex items-start gap-4'>
							<Avatar className='h-14 w-14'>
								<AvatarImage src={user.profile_image} alt={user.first_name} />
								<AvatarFallback className='text-lg bg-primary/10'>
									{user.first_name.charAt(0)}
									{user.last_name.charAt(0)}
								</AvatarFallback>
							</Avatar>
							<div className='flex-1 min-w-0'>
								<h3 className='text-lg font-semibold truncate'>
									{user.first_name} {user.last_name}
								</h3>
								<p className='text-sm text-muted-foreground truncate'>
									{user.email}
								</p>
								<div className='flex flex-wrap items-center gap-1.5 mt-2'>
									<Badge
										variant='outline'
										className={
											roleColors[user.role as keyof typeof roleColors]
										}
									>
										{user.role.charAt(0).toUpperCase() + user.role.slice(1)}
									</Badge>
									<Badge
										variant={user.is_active ? 'default' : 'destructive'}
									>
										{user.is_active ? 'Active' : 'Suspended'}
									</Badge>
									{user.is_verified && (
										<Badge
											variant='outline'
											className='border-green-500 text-green-600'
										>
											Verified
										</Badge>
									)}
								</div>
							</div>
						</div>

						<Separator />

						{/* Contact Information */}
						<div className='space-y-3'>
							<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
								Contact
							</h4>

							<div className='space-y-2'>
								<div className='flex items-center justify-between rounded-md border px-3 py-2.5'>
									<div className='flex items-center gap-3 min-w-0'>
										<IconMail className='h-4 w-4 text-muted-foreground shrink-0' />
										<div className='min-w-0'>
											<p className='text-xs text-muted-foreground'>Email</p>
											<p className='text-sm font-medium truncate'>
												{user.email}
											</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										className='h-8 w-8 shrink-0'
										onClick={() => copyToClipboard(user.email, 'Email')}
									>
										<IconCopy className='h-4 w-4' />
									</Button>
								</div>

								<div className='flex items-center justify-between rounded-md border px-3 py-2.5'>
									<div className='flex items-center gap-3 min-w-0'>
										<IconPhone className='h-4 w-4 text-muted-foreground shrink-0' />
										<div className='min-w-0'>
											<p className='text-xs text-muted-foreground'>Phone</p>
											<p className='text-sm font-medium truncate'>
												{user.phone_number}
											</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										className='h-8 w-8 shrink-0'
										onClick={() =>
											copyToClipboard(user.phone_number, 'Phone')
										}
									>
										<IconCopy className='h-4 w-4' />
									</Button>
								</div>
							</div>
						</div>

						<Separator />

						{/* Account Information */}
						<div className='space-y-3'>
							<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
								Account
							</h4>

							<div className='space-y-2'>
								<div className='flex items-center justify-between rounded-md border px-3 py-2.5'>
									<div className='flex items-center gap-3 min-w-0 flex-1'>
										<IconId className='h-4 w-4 text-muted-foreground shrink-0' />
										<div className='min-w-0 flex-1'>
											<p className='text-xs text-muted-foreground'>User ID</p>
											<p className='text-xs font-mono truncate'>{user.id}</p>
										</div>
									</div>
									<Button
										variant='ghost'
										size='icon'
										className='h-8 w-8 shrink-0'
										onClick={() => copyToClipboard(user.id, 'User ID')}
									>
										<IconCopy className='h-4 w-4' />
									</Button>
								</div>

								<div className='grid grid-cols-2 gap-2'>
									<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
										<IconShield className='h-4 w-4 text-muted-foreground shrink-0' />
										<div className='min-w-0'>
											<p className='text-xs text-muted-foreground'>Role</p>
											<p className='text-sm font-medium capitalize'>
												{user.role}
											</p>
										</div>
									</div>

									<div className='flex items-center gap-3 rounded-md border px-3 py-2.5'>
										<IconCalendar className='h-4 w-4 text-muted-foreground shrink-0' />
										<div className='min-w-0'>
											<p className='text-xs text-muted-foreground'>Joined</p>
											<p className='text-sm font-medium'>
												{formatDate(user.created_at)}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						<Separator />

						{/* Status Section */}
						<div className='space-y-3'>
							<h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
								Status
							</h4>

							<div className='grid grid-cols-2 gap-2'>
								<div className='rounded-md border px-3 py-2.5'>
									<p className='text-xs text-muted-foreground'>Account</p>
									<p className='text-sm font-medium'>
										{user.is_active ? (
											<span className='text-green-600'>Active</span>
										) : (
											<span className='text-red-600'>Suspended</span>
										)}
									</p>
								</div>
								<div className='rounded-md border px-3 py-2.5'>
									<p className='text-xs text-muted-foreground'>Verified</p>
									<p className='text-sm font-medium'>
										{user.is_verified ? (
											<span className='text-green-600'>Yes</span>
										) : (
											<span className='text-yellow-600'>No</span>
										)}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<SheetFooter>
					{user.is_active ? (
						<Button variant='destructive' className='w-full' onClick={onSuspend}>
							<IconUserOff className='h-4 w-4 mr-2' />
							Suspend User
						</Button>
					) : (
						<Button
							className='w-full bg-green-600 hover:bg-green-700 text-white'
							onClick={onActivate}
						>
							<IconUserCheck className='h-4 w-4 mr-2' />
							Activate User
						</Button>
					)}
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
