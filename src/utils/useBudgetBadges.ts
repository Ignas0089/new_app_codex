import { useCallback, useEffect, useState } from 'react';

import type { BudgetSnapshot, MonthKey } from '@domain/types';
import { getBudgetSnapshots } from '@services/budget';

export interface BudgetBadgesState {
  badges: BudgetSnapshot[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useBudgetBadges(month: MonthKey): BudgetBadgesState {
  const [badges, setBadges] = useState<BudgetSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBudgetSnapshots(month);
      setBadges(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Failed to load budget badges'));
      setBadges([]);
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    let isActive = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getBudgetSnapshots(month);
        if (isActive) {
          setBadges(data);
        }
      } catch (cause) {
        if (isActive) {
          setError(cause instanceof Error ? cause : new Error('Failed to load budget badges'));
          setBadges([]);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [month]);

  return {
    badges,
    isLoading,
    error,
    refresh: load
  };
}
