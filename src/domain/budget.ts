import type { Budget, BudgetSnapshot } from './types';

export interface BudgetComputationContext {
  budget: Budget;
  actualCents: number;
  previousBudget?: Budget | null;
  previousActualCents?: number;
  approachingRatio?: number;
}

const APPROACHING_RATIO_DEFAULT = 0.8;

function computeCarryInCents({
  budget,
  previousBudget,
  previousActualCents
}: BudgetComputationContext): number {
  if (!budget.carryOverPrev) {
    return 0;
  }
  if (!previousBudget) {
    return 0;
  }

  const previousLimit = previousBudget.limitCents;
  const previousActual = previousActualCents ?? 0;
  const leftover = previousLimit - previousActual;
  return Math.max(leftover, 0);
}

function resolveStatus(limitCents: number, actualCents: number, approachingRatio: number): BudgetSnapshot['status'] {
  if (limitCents === 0) {
    return actualCents > 0 ? 'over' : 'ok';
  }

  const ratio = actualCents / limitCents;
  if (ratio >= 1) {
    return 'over';
  }
  if (ratio >= approachingRatio) {
    return 'approaching';
  }
  return 'ok';
}

export function calculateBudgetSnapshot(context: BudgetComputationContext): BudgetSnapshot {
  const { budget, actualCents, approachingRatio = APPROACHING_RATIO_DEFAULT } = context;
  const carryInCents = computeCarryInCents(context);
  const effectiveLimit = budget.limitCents + carryInCents;
  const availableCents = effectiveLimit - actualCents;

  return {
    categoryId: budget.categoryId,
    month: budget.month,
    limitCents: budget.limitCents,
    actualCents,
    carryInCents,
    availableCents,
    status: resolveStatus(effectiveLimit, actualCents, approachingRatio)
  };
}
