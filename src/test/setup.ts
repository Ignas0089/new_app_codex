import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.mock('@paralleldrive/cuid2', () => ({
  createId: vi.fn(() => 'generated-id')
}));

afterEach(() => {
  cleanup();
});
