import { getMainSets, getBBBSets } from './calculator'
import { BBB_LIFT, BBB_COMPANION, ACCESSORY_GROUPS, LIFT_LABELS, type Lift, type AnyLift } from './constants'

export type PlannedSet = {
  exercise: string
  exerciseLabel: string
  setNumber: number
  plannedReps: number
  plannedWeight: number | null
  lastWeight: number | null
  lastReps: number | null
  isAmrap: boolean
  isAccessory: boolean
  isBBB: boolean
  supersetGroupId: number | null
  supersetRole: 'a' | 'b' | null
}

export function buildWorkoutPlan(
  dayType: Lift,
  weekNumber: 1 | 2 | 3 | 4,
  tms: Record<AnyLift, number>
): PlannedSet[] {
  const sets: PlannedSet[] = []

  // Main lift sets
  getMainSets(tms[dayType], weekNumber).forEach((s, i) => {
    sets.push({
      exercise: dayType,
      exerciseLabel: LIFT_LABELS[dayType],
      setNumber: i + 1,
      plannedReps: s.plannedReps,
      plannedWeight: s.plannedWeight,
      lastWeight: null,
      lastReps: null,
      isAmrap: s.isAmrap,
      isAccessory: false,
      isBBB: false,
      supersetGroupId: null,
      supersetRole: null,
    })
  })

  // BBB sets — paired with companion exercise during rest
  const bbbLift = BBB_LIFT[dayType]
  // Всегда суффикс _bbb: иначе BBB-присед на дне становой пишется как 'squat'
  // и сталкивается с рабочим приседом — история и хинт «прошлый раз» ломаются.
  const bbbExercise = `${bbbLift}_bbb`
  const bbbTm = bbbLift === 'rdl' ? tms['deadlift'] : (tms[bbbLift] ?? tms[dayType])
  const companion = BBB_COMPANION[dayType]
  let groupId = 0

  getBBBSets(bbbTm).forEach((s, i) => {
    sets.push({
      exercise: bbbExercise,
      exerciseLabel: `${LIFT_LABELS[bbbLift]} (BBB)`,
      setNumber: i + 1,
      plannedReps: s.plannedReps,
      plannedWeight: s.plannedWeight,
      lastWeight: null,
      lastReps: null,
      isAmrap: false,
      isAccessory: false,
      isBBB: true,
      supersetGroupId: groupId,
      supersetRole: 'a',
    })
    sets.push({
      exercise: companion.name,
      exerciseLabel: companion.name,
      setNumber: i + 1,
      plannedReps: companion.reps,
      plannedWeight: null,
      lastWeight: null,
      lastReps: null,
      isAmrap: false,
      isAccessory: true,
      isBBB: false,
      supersetGroupId: groupId,
      supersetRole: 'b',
    })
  })
  groupId++

  // Accessories — interleave superset pairs
  ACCESSORY_GROUPS[dayType].forEach(group => {
    if (group.type === 'solo') {
      for (let i = 1; i <= group.item.sets; i++) {
        sets.push({
          exercise: group.item.name,
          exerciseLabel: group.item.name,
          setNumber: i,
          plannedReps: group.item.reps,
          plannedWeight: null,
          lastWeight: null,
          lastReps: null,
          isAmrap: false,
          isAccessory: true,
          isBBB: false,
          supersetGroupId: null,
          supersetRole: null,
        })
      }
    } else {
      const { a, b } = group
      const maxSets = Math.max(a.sets, b.sets)
      for (let i = 1; i <= maxSets; i++) {
        if (i <= a.sets) {
          const paired = i <= b.sets
          sets.push({
            exercise: a.name,
            exerciseLabel: a.name,
            setNumber: i,
            plannedReps: a.reps,
            plannedWeight: null,
            lastWeight: null,
            lastReps: null,
            isAmrap: false,
            isAccessory: true,
            isBBB: false,
            supersetGroupId: paired ? groupId : null,
            supersetRole: paired ? 'a' : null,
          })
        }
        if (i <= b.sets) {
          const paired = i <= a.sets
          sets.push({
            exercise: b.name,
            exerciseLabel: b.name,
            setNumber: i,
            plannedReps: b.reps,
            plannedWeight: null,
            lastWeight: null,
            lastReps: null,
            isAmrap: false,
            isAccessory: true,
            isBBB: false,
            supersetGroupId: paired ? groupId : null,
            supersetRole: paired ? 'b' : null,
          })
        }
      }
      groupId++
    }
  })

  return sets
}
