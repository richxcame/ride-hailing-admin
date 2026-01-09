'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { IconLoader2 } from '@tabler/icons-react';

interface LoginFormData {
	email: string;
	password: string;
}

export function LoginForm({
	className,
	...props
}: React.ComponentProps<'div'>) {
	const router = useRouter();
	const { login } = useAuth();
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>();

	const onSubmit = async (data: LoginFormData) => {
		setIsLoading(true);

		try {
			await login(data);
			toast.success('Login successful', {
				description: 'Welcome to MonteGo Admin',
			});
			router.push('/dashboard');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : 'Login failed';
			toast.error('Login failed', {
				description: errorMessage,
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className={cn('flex flex-col gap-6', className)} {...props}>
			<Card>
				<CardHeader className='text-center'>
					<CardTitle className='text-xl'>Welcome back</CardTitle>
					<CardDescription>
						Login with your admin credentials
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)}>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor='email'>Email</FieldLabel>
								<Input
									id='email'
									type='email'
									placeholder='admin@montego.com'
									{...register('email', {
										required: 'Email is required',
										pattern: {
											value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
											message: 'Invalid email address',
										},
									})}
									disabled={isLoading}
								/>
								{errors.email && (
									<FieldDescription className='text-destructive'>
										{errors.email.message}
									</FieldDescription>
								)}
							</Field>
							<Field>
								<div className='flex items-center'>
									<FieldLabel htmlFor='password'>
										Password
									</FieldLabel>
								</div>
								<Input
									id='password'
									type='password'
									{...register('password', {
										required: 'Password is required',
										minLength: {
											value: 8,
											message: 'Password must be at least 8 characters',
										},
									})}
									disabled={isLoading}
								/>
								{errors.password && (
									<FieldDescription className='text-destructive'>
										{errors.password.message}
									</FieldDescription>
								)}
							</Field>
							<Field>
								<Button type='submit' disabled={isLoading}>
									{isLoading && (
										<IconLoader2 className='h-4 w-4 animate-spin' />
									)}
									{isLoading ? 'Logging in...' : 'Login'}
								</Button>
								<FieldDescription className='text-center text-muted-foreground'>
									Admin access only
								</FieldDescription>
							</Field>
						</FieldGroup>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
