import { buildWorkoutPlan, formatPlannedReps } from './workout-builder'
import { pickLastExerciseData } from './last-weights'
import { shouldSuggestIncrease } from './set-weight'
import { RANGE_ACCESSORIES, type Lift } from './constants'

const tms = { squat: 100, bench: 80, deadlift: 110, ohp: 40, rdl: 90 }

it('все согласованные аксессуары имеют 8–10; BBB 5×8; исключения сохранены', () => {
  const seen = new Set<string>()
  for (const day of ['squat', 'bench', 'deadlift'] as Lift[]) {
    const plan = buildWorkoutPlan(day, 4, tms)
    for (const s of plan) {
      if (RANGE_ACCESSORIES.has(s.exercise)) {
        seen.add(s.exercise)
        expect(formatPlannedReps(s)).toBe('8–10')
      } else if (s.isAccessory) {
        expect(s.plannedRepsMax).toBeUndefined()
        expect(s.plannedReps).toBe(s.exercise === 'Подтягивания' ? 5 : 15)
      }
    }
    const bbb = plan.filter(s => s.isBBB)
    expect(bbb).toHaveLength(day === 'squat' ? 0 : 5)
    expect(bbb.every(s => s.plannedReps === 8)).toBe(true)
  }
  expect(seen).toEqual(RANGE_ACCESSORIES)
})

it.each([
  [[10, 10, 10], [20, 20, 20], true],
  [[11, 11, 8], [20, 20, 20], false],
  [[10, 10], [20, 20], false],
  [[10, 10, 10], [20, 25, 25], false],
] as [number[], number[], boolean][])('проверяет каждый подход: %j, веса %j', (reps, weights, expected) => {
  const rows = reps.map((actual_reps, i) => ({ exercise: 'Молотки', actual_reps,
    actual_weight_kg: weights[i], set_number: i + 1, session_id: 'latest', completed_at: '2026-10-24' }))
  const data = pickLastExerciseData(rows, ['Молотки'], { Молотки: { sets: 3, reps: 10 } })['Молотки']
  const set = buildWorkoutPlan('squat', 4, tms).find(s => s.exercise === 'Молотки')!
  expect(shouldSuggestIncrease({ ...set, ...data })).toBe(expected)
})

it('не берёт готовность из старой сессии и проверяет пять подходов BBB', () => {
  const rows = Array.from({ length: 5 }, (_, i) => ({ exercise: 'bench_bbb', actual_reps: 8,
    actual_weight_kg: 40, set_number: i + 1, session_id: 'old', completed_at: '2026-10-20' }))
  const req = { bench_bbb: { sets: 5, reps: 8 } }
  expect(pickLastExerciseData(rows, ['bench_bbb'], req).bench_bbb.increaseReady).toBe(true)
  rows.push({ ...rows[0], session_id: 'new', completed_at: '2026-10-24' })
  expect(pickLastExerciseData(rows, ['bench_bbb'], req).bench_bbb.increaseReady).toBe(false)
})
