import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom carries DOM nodes between tests by default; clean up so each test
// starts with a fresh document.
afterEach(() => {
	cleanup();
});
