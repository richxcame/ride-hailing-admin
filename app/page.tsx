import { redirect } from 'next/navigation';

export default function Page() {
	// AuthProvider handles auth gating: it will bounce to /login if unauthenticated.
	redirect('/dashboard');
}
