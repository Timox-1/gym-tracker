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

  it.each([1, 2, 3, 4] as const)('понедельник неделя %i: три пары выпадов и сгибаний, до прежних аксессуаров', week => {
    const plan = buildWorkoutPlan('squat', week, TMS)
    const lunges = plan.filter(s => s.exercise === 'Выпады назад с гантелями')
    expect(plan.filter(s => s.isBBB)).toHaveLength(0)
    expect(plan.some(s => s.exercise.startsWith('rdl'))).toBe(false)
    expect(lunges.map(s => s.setNumber)).toEqual([1, 2, 3])
    expect(lunges.every(s => s.exercise === 'Выпады назад с гантелями' &&
      s.exerciseLabel.includes('на каждую ногу; вес одной гантели') &&
      s.plannedReps === 8 && s.plannedRepsMax === 10 && s.plannedWeight === null && s.isAccessory &&
      s.supersetGroupId === 0 && s.supersetRole === 'a')).toBe(true)
    const curls = plan.filter(s => s.exercise === 'Сгибания ног в тренажёре')
    expect(curls.map(s => s.setNumber)).toEqual([1, 2, 3])
    expect(curls.every(s => s.plannedReps === 8 && s.plannedRepsMax === 10 && s.plannedWeight === null &&
      s.isAccessory && s.supersetGroupId === 0 && s.supersetRole === 'b')).toBe(true)
    expect(plan.slice(3, 9).map(s => s.exercise)).toEqual(Array(3).fill([
      'Выпады назад с гантелями', 'Сгибания ног в тренажёре',
    ]).flat())
    expect(plan.some(s => s.exercise === 'Разгибания ног')).toBe(false)
    expect(plan.slice(9).map(s => s.exercise)).toEqual([
      'Подтягивания', 'Брусья', 'Подтягивания', 'Брусья', 'Подтягивания', 'Брусья',
      'Подтягивания', 'Подтягивания',
      'Молотки', 'Трицепс', 'Молотки', 'Трицепс', 'Молотки', 'Трицепс',
      'Шраги за спиной', 'Подъём ног в висе', 'Шраги за спиной', 'Подъём ног в висе',
      'Шраги за спиной', 'Подъём ног в висе',
    ])
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
