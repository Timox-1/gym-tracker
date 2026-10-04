import { suggestedWeight, shouldSuggestIncrease } from './set-weight'
import type { PlannedSet } from './workout-builder'

function set(partial: Partial<PlannedSet>): PlannedSet {
  return {
    exercise: 'squat_bbb',
    exerciseLabel: 'Присед (BBB)',
    setNumber: 1,
    plannedReps: 10,
    plannedWeight: 52.5,
    lastWeight: null,
    lastReps: null,
    isAmrap: false,
    isAccessory: false,
    isBBB: true,
    supersetGroupId: 0,
    supersetRole: 'a',
    ...partial,
  }
}

describe('suggestedWeight', () => {
  it('у BBB берёт прошлый факт, а не расчётные 50%', () => {
    expect(suggestedWeight(set({ plannedWeight: 52.5, lastWeight: 60 }))).toBe(60)
  })

  it('у BBB не опускается ниже расчётного, если факт меньше', () => {
    expect(suggestedWeight(set({ plannedWeight: 60, lastWeight: 55 }))).toBe(60)
  })

  it('у базы остаётся плановый вес', () => {
    expect(suggestedWeight(set({
      isBBB: false,
      plannedWeight: 102.5,
      lastWeight: 90,
    }))).toBe(102.5)
  })

  it('у аксессуара берёт прошлый вес', () => {
    expect(suggestedWeight(set({
      isBBB: false,
      isAccessory: true,
      plannedWeight: null,
      lastWeight: 40,
    }))).toBe(40)
  })
})

describe('shouldSuggestIncrease', () => {
  it('предлагает добавить, если повторов больше плана', () => {
    expect(shouldSuggestIncrease(set({ lastReps: 11, plannedReps: 10 }))).toBe(true)
  })

  it('молчит, если уложились в план', () => {
    expect(shouldSuggestIncrease(set({ lastReps: 10, plannedReps: 10 }))).toBe(false)
  })

  it('не трогает рабочие сеты базы', () => {
    expect(shouldSuggestIncrease(set({
      isBBB: false,
      lastReps: 8,
      plannedReps: 5,
    }))).toBe(false)
  })
})
