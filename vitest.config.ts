import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	resolve: {
		// Resolve `@/...` imports the same way the Next.js build does.
		tsconfigPaths: true,
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./lib/test/setup.ts'],
		exclude: ['node_modules/**', '.next/**', 'dist/**'],
		// Don't pick up Playwright-style E2E specs as unit tests.
		include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
	},
});
