import { WEEK_SCHEMES, BBB_PCT, BBB_REPS, BBB_SETS } from './constants'

// Рабочие недели: округляем до ближайшего блина.
// Раньше был Math.floor — систематически недогружал до 2.5 кг, сильнее всего
// на AMRAP-сетах (становая нед. 3: 97.5 вместо 99.75).
export function calcWeight(tm: number, pct: number, nearest = 2.5): number {
  return Math.round((tm * pct) / nearest) * nearest
}

// Делоад: округляем вниз. Неделя 4 нужна для разгрузки — если округлять
// до ближайшего, она становится тяжелее, что противоречит её смыслу.
export function calcDeloadWeight(tm: number, pct: number, nearest = 2.5): number {
  return Math.floor((tm * pct) / nearest) * nearest
}

export function calcEstimated1RM(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30))
}

export function getMainSets(tm: number, week: 1 | 2 | 3 | 4) {
  const weigh = week === 4 ? calcDeloadWeight : calcWeight
  return WEEK_SCHEMES[week].map(({ reps, pct, isAmrap }) => ({
    plannedReps: reps,
    plannedWeight: weigh(tm, pct),
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
