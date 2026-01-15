'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
import { adminService } from '@/lib/api/admin.service';
import { User } from '@/lib/types/models';
import { UsersTable } from '@/components/users-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [roleFilter, setRoleFilter] = useState<string>('all');
	const [statusFilter, setStatusFilter] = useState<string>('all');
	const [pagination, setPagination] = useState({
		total: 0,
		limit: 20,
		offset: 0,
	});

	const fetchUsers = async () => {
		try {
			setIsLoading(true);
			const response = await adminService.getUsers({
				limit: pagination.limit,
				offset: pagination.offset,
				...(roleFilter !== 'all' && { role: roleFilter }),
				...(statusFilter !== 'all' && {
					is_active: statusFilter === 'active',
				}),
				...(searchQuery && { search: searchQuery }),
			});

			console.log(response, 'response');

			setUsers(response.data);
			setPagination((prev) => ({
				...prev,
				total: response.meta.total,
			}));
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to load users';
			toast.error('Failed to load users', {
				description: errorMessage,
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, [pagination.offset, pagination.limit, roleFilter, statusFilter]);

	const handleSearch = () => {
		setPagination((prev) => ({ ...prev, offset: 0 }));
		fetchUsers();
	};

	const handleRefresh = () => {
		fetchUsers();
		toast.success('Users refreshed');
	};

	const handlePageChange = (newOffset: number) => {
		setPagination((prev) => ({ ...prev, offset: newOffset }));
	};

	const handleUserAction = async (
		action: 'suspend' | 'activate',
		userId: string
	) => {
		try {
			if (action === 'suspend') {
				await adminService.suspendUser(userId, {
					reason: 'Suspended by admin',
				});
				toast.success('User suspended successfully');
			} else {
				await adminService.activateUser(userId);
				toast.success('User activated successfully');
			}
			fetchUsers();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Action failed';
			toast.error('Failed to update user', {
				description: errorMessage,
			});
		}
	};

	return (
		<div className='flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>
						Users
					</h1>
					<p className='text-sm text-muted-foreground'>
						Manage all users in the system
					</p>
				</div>
				<div className='flex gap-2'>
					<Button variant='outline' size='sm' onClick={handleRefresh}>
						<IconRefresh className='h-4 w-4' />
						Refresh
					</Button>
					<Button size='sm'>
						<IconPlus className='h-4 w-4' />
						Add User
					</Button>
				</div>
			</div>

			<div className='flex flex-col gap-4 rounded-lg border p-4'>
				<div className='flex flex-col gap-4 md:flex-row md:items-center'>
					<div className='flex-1'>
						<div className='flex gap-2'>
							<Input
								placeholder='Search by email or name...'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										handleSearch();
									}
								}}
								className='max-w-sm'
							/>
							<Button onClick={handleSearch}>Search</Button>
						</div>
					</div>
					<div className='flex gap-2'>
						<Select
							value={roleFilter}
							onValueChange={setRoleFilter}
						>
							<SelectTrigger className='w-35'>
								<SelectValue placeholder='Role' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Roles</SelectItem>
								<SelectItem value='rider'>Riders</SelectItem>
								<SelectItem value='driver'>Drivers</SelectItem>
								<SelectItem value='admin'>Admins</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={statusFilter}
							onValueChange={setStatusFilter}
						>
							<SelectTrigger className='w-35'>
								<SelectValue placeholder='Status' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value='all'>All Status</SelectItem>
								<SelectItem value='active'>Active</SelectItem>
								<SelectItem value='inactive'>
									Inactive
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				<UsersTable
					users={users}
					isLoading={isLoading}
					pagination={pagination}
					onPageChange={handlePageChange}
					onUserAction={handleUserAction}
				/>
			</div>
		</div>
	);
}
