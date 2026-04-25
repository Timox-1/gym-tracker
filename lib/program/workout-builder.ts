import { getMainSets, getBBBSets } from './calculator'
import { BBB_LIFT, ACCESSORIES, LIFT_LABELS, type Lift, type AnyLift } from './constants'

export type PlannedSet = {
  exercise: string
  exerciseLabel: string
  setNumber: number
  plannedReps: number
  plannedWeight: number | null
  isAmrap: boolean
  isAccessory: boolean
}

export function buildWorkoutPlan(
  dayType: Lift,
  weekNumber: 1 | 2 | 3 | 4,
  tms: Record<AnyLift, number>
): PlannedSet[] {
  const sets: PlannedSet[] = []

  getMainSets(tms[dayType], weekNumber).forEach((s, i) => {
    sets.push({
      exercise: dayType,
      exerciseLabel: LIFT_LABELS[dayType],
      setNumber: i + 1,
      plannedReps: s.plannedReps,
      plannedWeight: s.plannedWeight,
      isAmrap: s.isAmrap,
      isAccessory: false,
    })
  })

  const bbbLift = BBB_LIFT[dayType]
  const bbbTm = bbbLift === 'rdl' ? tms['deadlift'] : (tms[bbbLift] ?? tms[dayType])
  getBBBSets(bbbTm).forEach((s, i) => {
    sets.push({
      exercise: bbbLift,
      exerciseLabel: `${LIFT_LABELS[bbbLift]} (BBB)`,
      setNumber: i + 1,
      plannedReps: s.plannedReps,
      plannedWeight: s.plannedWeight,
      isAmrap: false,
      isAccessory: false,
    })
  })

  ACCESSORIES[dayType].forEach(acc => {
    for (let i = 1; i <= acc.sets; i++) {
      sets.push({
        exercise: acc.name,
        exerciseLabel: acc.name,
        setNumber: i,
        plannedReps: acc.reps,
        plannedWeight: null,
        isAmrap: false,
        isAccessory: true,
      })
    }
  })

  return sets
}
