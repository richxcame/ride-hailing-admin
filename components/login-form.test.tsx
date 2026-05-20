import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// vi.mock() factories are hoisted above imports — use vi.hoisted() so the
// mock fns are initialised before the factories reference them.
const { loginMock, pushMock, toastSuccessMock, toastErrorMock } = vi.hoisted(
	() => ({
		loginMock: vi.fn(),
		pushMock: vi.fn(),
		toastSuccessMock: vi.fn(),
		toastErrorMock: vi.fn(),
	}),
);

vi.mock('@/hooks/use-auth', () => ({
	useAuth: () => ({ login: loginMock }),
}));

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: pushMock }),
}));

vi.mock('sonner', () => ({
	toast: {
		success: toastSuccessMock,
		error: toastErrorMock,
	},
}));

import { LoginForm } from '@/components/login-form';

describe('LoginForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('blocks submission and surfaces validation errors for empty inputs', async () => {
		const user = userEvent.setup();
		render(<LoginForm />);

		await user.click(screen.getByRole('button', { name: /login/i }));

		expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
		expect(screen.getByText(/password is required/i)).toBeInTheDocument();
		expect(loginMock).not.toHaveBeenCalled();
		expect(pushMock).not.toHaveBeenCalled();
	});

	it('rejects too-short passwords client-side', async () => {
		const user = userEvent.setup();
		render(<LoginForm />);

		await user.type(screen.getByLabelText(/email/i), 'admin@montego.com');
		await user.type(screen.getByLabelText(/password/i), 'short');
		await user.click(screen.getByRole('button', { name: /login/i }));

		expect(
			await screen.findByText(/password must be at least 8 characters/i),
		).toBeInTheDocument();
		expect(loginMock).not.toHaveBeenCalled();
	});

	it('calls login and navigates to /dashboard on success', async () => {
		loginMock.mockResolvedValueOnce(undefined);
		const user = userEvent.setup();
		render(<LoginForm />);

		await user.type(screen.getByLabelText(/email/i), 'admin@montego.com');
		await user.type(screen.getByLabelText(/password/i), 'supersecure');
		await user.click(screen.getByRole('button', { name: /login/i }));

		await vi.waitFor(() => {
			expect(loginMock).toHaveBeenCalledWith({
				email: 'admin@montego.com',
				password: 'supersecure',
			});
			expect(pushMock).toHaveBeenCalledWith('/dashboard');
			expect(toastSuccessMock).toHaveBeenCalled();
		});
	});

	it('shows an error toast and does not navigate on login failure', async () => {
		loginMock.mockRejectedValueOnce(new Error('invalid credentials'));
		const user = userEvent.setup();
		render(<LoginForm />);

		await user.type(screen.getByLabelText(/email/i), 'admin@montego.com');
		await user.type(screen.getByLabelText(/password/i), 'supersecure');
		await user.click(screen.getByRole('button', { name: /login/i }));

		await vi.waitFor(() => {
			expect(toastErrorMock).toHaveBeenCalledWith(
				'Login failed',
				expect.objectContaining({ description: 'invalid credentials' }),
			);
			expect(pushMock).not.toHaveBeenCalled();
		});
	});
});
