import { WEEK_SCHEMES, BBB_PCT, BBB_REPS, BBB_SETS } from './constants'

export function roundToNearest(weight: number, nearest = 2.5): number {
  const div = weight / nearest
  const floored = Math.floor(div)
  const remainder = div - floored
  if (remainder >= 0.3) return Math.ceil(div) * nearest
  return floored * nearest
}

export function calcWeight(tm: number, pct: number, nearest = 2.5): number {
  return Math.floor((tm * pct) / nearest) * nearest
}

export function calcEstimated1RM(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30))
}

export function getMainSets(tm: number, week: 1 | 2 | 3 | 4) {
  return WEEK_SCHEMES[week].map(({ reps, pct, isAmrap }) => ({
    plannedReps: reps,
    plannedWeight: calcWeight(tm, pct),
    isAmrap,
  }))
}

export function getBBBSets(tm: number) {
  const weight = calcWeight(tm, BBB_PCT)
  return Array.from({ length: BBB_SETS }, (_, i) => ({
    setNumber: i + 1,
    plannedReps: BBB_REPS,
    plannedWeight: weight,
    isAmrap: false,
  }))
}
