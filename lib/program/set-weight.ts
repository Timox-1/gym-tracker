import type { PlannedSet } from './workout-builder'

/** Вес, который показываем и подставляем в поле.
 *  База 5/3/1 — строго план. BBB — прошлый факт, но не ниже расчётного.
 *  Аксессуар — прошлый факт, плана нет. */
export function suggestedWeight(s: PlannedSet): number | null {
  if (s.isBBB && s.lastWeight != null) {
    return Math.max(s.lastWeight, s.plannedWeight ?? 0)
  }
  if (s.isAccessory && s.lastWeight != null) return s.lastWeight
  return s.plannedWeight
}

/** Прошлый раз перекрыл план по повторам — есть смысл добавить вес. */
export function shouldSuggestIncrease(s: PlannedSet): boolean {
  return (s.isAccessory || s.isBBB)
    && s.lastReps != null
    && s.lastReps > s.plannedReps
}
