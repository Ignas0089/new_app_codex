import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { useBudgetBadges } from '../useBudgetBadges';
import type { BudgetSnapshot } from '@domain/types';
import { getBudgetSnapshots } from '@services/budget';

vi.mock('@services/budget', () => ({
  getBudgetSnapshots: vi.fn()
}));

const mockSnapshots: BudgetSnapshot[] = [
  {
    categoryId: 'cat-1',
    month: '2024-05',
    limitCents: 30_000,
    actualCents: 20_000,
    availableCents: 10_000,
    carryInCents: 0,
    status: 'ok'
  }
];

beforeEach(() => {
  vi.mocked(getBudgetSnapshots).mockReset();
});

describe('useBudgetBadges', () => {
  it('loads data on mount and exposes state helpers', async () => {
    vi.mocked(getBudgetSnapshots).mockResolvedValue(mockSnapshots);

    const { result } = renderHook(() => useBudgetBadges('2024-05'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getBudgetSnapshots).toHaveBeenCalledWith('2024-05');
    expect(result.current.badges).toEqual(mockSnapshots);
    expect(result.current.error).toBeNull();

    vi.mocked(getBudgetSnapshots).mockResolvedValue([{ ...mockSnapshots[0], actualCents: 25_000 }]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.badges[0].actualCents).toBe(25_000);
  });

  it('handles errors gracefully', async () => {
    vi.mocked(getBudgetSnapshots).mockRejectedValue(new Error('Boom'));

    const { result } = renderHook(() => useBudgetBadges('2024-05'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.badges).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
