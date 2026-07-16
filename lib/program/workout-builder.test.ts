import { buildWorkoutPlan } from './workout-builder'
import type { AnyLift } from './constants'

const TMS = { squat: 97.5, bench: 90, deadlift: 105, ohp: 30, rdl: 105 } as Record<AnyLift, number>

describe('buildWorkoutPlan — имена BBB-упражнений', () => {
  it('BBB-присед на дне становой не пересекается с рабочим приседом', () => {
    const plan = buildWorkoutPlan('deadlift', 3, TMS)
    const bbb = plan.filter(s => s.isBBB)
    const main = plan.filter(s => !s.isBBB && !s.isAccessory)

    expect(bbb.every(s => s.exercise === 'squat_bbb')).toBe(true)
    expect(main.every(s => s.exercise === 'deadlift')).toBe(true)
    // регрессия: раньше BBB писался как 'squat' и сталкивался с рабочим приседом
    expect(plan.some(s => s.exercise === 'squat')).toBe(false)
  })

  it('румынка на дне приседа — rdl_bbb, рабочий присед — squat', () => {
    const plan = buildWorkoutPlan('squat', 1, TMS)
    expect(plan.filter(s => s.isBBB).every(s => s.exercise === 'rdl_bbb')).toBe(true)
    expect(plan.some(s => s.exercise === 'rdl')).toBe(false)
    expect(plan.filter(s => !s.isBBB && !s.isAccessory).every(s => s.exercise === 'squat')).toBe(true)
  })

  it('жим: BBB — bench_bbb, рабочий — bench', () => {
    const plan = buildWorkoutPlan('bench', 2, TMS)
    expect(plan.filter(s => s.isBBB).every(s => s.exercise === 'bench_bbb')).toBe(true)
    expect(plan.filter(s => !s.isBBB && !s.isAccessory).every(s => s.exercise === 'bench')).toBe(true)
  })

  it('имя BBB всегда отличается от имени рабочего лифта', () => {
    for (const day of ['squat', 'bench', 'deadlift'] as const) {
      const plan = buildWorkoutPlan(day, 1, TMS)
      const bbbNames = new Set(plan.filter(s => s.isBBB).map(s => s.exercise))
      const mainNames = new Set(plan.filter(s => !s.isBBB && !s.isAccessory).map(s => s.exercise))
      for (const n of bbbNames) expect(mainNames.has(n)).toBe(false)
    }
  })
})
