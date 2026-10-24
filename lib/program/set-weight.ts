import type { PlannedSet } from './workout-builder'

/** Вес, который показываем и подставляем в поле.
 *  База 5/3/1 — строго план. BBB — прошлый факт, но не ниже расчётного.
 *  Аксессуар — прошлый факт, иначе стартовый вес, если он задан. */
export function suggestedWeight(s: PlannedSet): number | null {
  if (s.isBBB && s.lastWeight != null) {
    return Math.max(s.lastWeight, s.plannedWeight ?? 0)
  }
  if (s.isAccessory && s.lastWeight != null) return s.lastWeight
  return s.plannedWeight
}

/** Прибавка только после проверки всех подходов последней сессии на одном весе. */
export function shouldSuggestIncrease(s: PlannedSet): boolean {
  return (s.isAccessory || s.isBBB) && s.increaseReady === true
}
