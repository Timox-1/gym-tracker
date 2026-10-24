import type { PlannedSet } from './workout-builder'

export function getRestSeconds(set: PlannedSet): number {
  if (set.restSeconds != null) return set.restSeconds
  if (set.isAccessory) return 90
  if (set.isBBB) return 120
  return 180
}

export function isImmediateSupersetNext(current: PlannedSet, next: PlannedSet | undefined): boolean {
  return !!next && current.supersetGroupId !== null &&
    next.supersetGroupId === current.supersetGroupId &&
    current.supersetRole === 'a' && next.supersetRole === 'b'
}
