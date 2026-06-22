'use client';

import { useEffect } from 'react';

// Global error boundary — the last line of defence. It replaces the root layout
// when the layout itself throws, so it can't rely on app providers or the global
// stylesheet; styling is intentionally inline.
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error('Global error:', error);
	}, [error]);

	return (
		<html lang='en'>
			<body
				style={{
					margin: 0,
					minHeight: '100vh',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					gap: '1rem',
					padding: '2rem',
					fontFamily: 'system-ui, -apple-system, sans-serif',
					background: '#0a0a0a',
					color: '#fafafa',
					textAlign: 'center',
				}}
			>
				<h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
					Something went wrong
				</h2>
				<p style={{ fontSize: '0.875rem', color: '#a1a1aa', maxWidth: '28rem', margin: 0 }}>
					A critical error occurred while loading the app. Please reload.
				</p>
				<button
					onClick={reset}
					style={{
						cursor: 'pointer',
						borderRadius: '0.5rem',
						border: '1px solid #3f3f46',
						background: 'transparent',
						color: 'inherit',
						padding: '0.5rem 1rem',
						fontSize: '0.875rem',
					}}
				>
					Try again
				</button>
			</body>
		</html>
	);
}
