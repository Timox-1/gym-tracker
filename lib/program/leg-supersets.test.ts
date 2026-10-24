import { buildWorkoutPlan } from './workout-builder'
import { planBlocks } from './blocks'
import { nextIndex } from './next-index'
import { getRestSeconds, isImmediateSupersetNext } from './rest'
import { suggestedWeight, shouldSuggestIncrease } from './set-weight'
import type { AnyLift } from './constants'

const TMS = { squat: 97.5, bench: 90, deadlift: 105, ohp: 30, rdl: 105 } as Record<AnyLift, number>

describe('пары ног и шея', () => {
  it('понедельник: мгновенный переход выпады→сгибания, затем обычный отдых', () => {
    const plan = buildWorkoutPlan('squat', 1, TMS)
    for (const index of [3, 5, 7]) {
      expect(isImmediateSupersetNext(plan[index], plan[index + 1])).toBe(true)
      expect(isImmediateSupersetNext(plan[index + 1], plan[index + 2])).toBe(false)
      expect(getRestSeconds(plan[index + 1])).toBe(90)
    }
  })

  it.each([1, 2, 3, 4] as const)('пятница неделя %i: шея в четырёх промежутках, пятый присед отдельно', week => {
    const plan = buildWorkoutPlan('deadlift', week, TMS)
    const blocks = planBlocks(plan)
    const bbb = blocks.find(b => b.id === 'g0')!
    const sets = plan.slice(bbb.start, bbb.end)
    expect(sets.map(s => s.exercise)).toEqual([
      'squat_bbb', 'Шея: боковые наклоны', 'squat_bbb', 'Шея: сгибание и разгибание',
      'squat_bbb', 'Шея: боковые наклоны', 'squat_bbb', 'Шея: сгибание и разгибание', 'squat_bbb',
    ])
    expect(sets.filter(s => s.isBBB).map(s => s.setNumber)).toEqual([1, 2, 3, 4, 5])
    for (const index of [0, 2, 4, 6]) {
      const neck = sets[index + 1]
      expect(isImmediateSupersetNext(sets[index], neck)).toBe(true)
      expect(isImmediateSupersetNext(neck, sets[index + 2])).toBe(false)
      expect(getRestSeconds(neck)).toBe(120)
      expect(neck.plannedReps).toBe(15)
      expect(neck.plannedWeight).toBeNull()
      expect(neck.setNumber).toBe(index < 4 ? 1 : 2)
      expect(neck.lastWeight).toBeNull()
      expect(suggestedWeight(neck)).toBeNull()
      expect(shouldSuggestIncrease(neck)).toBe(false)
      const saved = new Set(Array.from({ length: bbb.start + index + 2 }, (_, i) => i))
      expect(nextIndex(plan.length, bbb.start + index + 1, bbb, saved)).toBe(bbb.start + index + 2)
    }
    expect(sets[8].supersetGroupId).toBeNull()
    expect(sets[8].supersetRole).toBeNull()
    expect(getRestSeconds(sets[8])).toBe(120)
    expect(plan.some(s => s.exercise === 'Шея')).toBe(false)
    expect(blocks.filter(b => b.title.includes('squat'))).toHaveLength(0)

    const legs = blocks.find(b => b.id === 'g1')!
    const legSets = plan.slice(legs.start, legs.end)
    expect(legSets.map(s => s.exercise)).toEqual([
      'Разгибания ног', 'Икры', 'Разгибания ног', 'Икры', 'Разгибания ног', 'Икры', 'Икры', 'Икры',
    ])
    expect(legSets.slice(6).every(s => s.supersetGroupId === null && s.supersetRole === null)).toBe(true)
    expect(legSets.filter(s => s.exercise === 'Икры').map(s => s.setNumber)).toEqual([1, 2, 3, 4, 5])
    expect(blocks.map(b => b.id)).toEqual(['main', 'g0', 'g1', 'g2', 'g3'])
    expect(plan.slice(legs.end).map(s => s.exercise)).toEqual([
      'Тяга штанги в наклоне', 'Пресс', 'Тяга штанги в наклоне', 'Пресс',
      'Тяга штанги в наклоне', 'Пресс', 'Тяга штанги в наклоне',
      'Сгибания сидя', 'Разведения', 'Сгибания сидя', 'Разведения', 'Сгибания сидя', 'Разведения',
    ])
    expect(blocks.flatMap(b => Array.from({ length: b.end - b.start }, (_, i) => b.start + i)))
      .toEqual(Array.from({ length: plan.length }, (_, i) => i))
  })
})
