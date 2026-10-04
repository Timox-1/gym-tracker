import { buildWorkoutPlan } from './workout-builder'
import { planBlocks } from './blocks'
import { nextIndex } from './next-index'
import type { AnyLift } from './constants'

const TMS = {
  squat: 105,
  bench: 95,
  deadlift: 120,
  ohp: 30,
  rdl: 120,
} as Record<AnyLift, number>

function savedThrough(n: number): Set<number> {
  const s = new Set<number>()
  for (let i = 0; i <= n; i++) s.add(i)
  return s
}

describe('nextIndex', () => {
  const plan = buildWorkoutPlan('squat', 1, TMS)
  const blocks = planBlocks(plan)
  const planLength = plan.length

  it('линейный проход: пустой saved или {0..idx} → idx+1, в конце null', () => {
    const wholeBlock = { start: 0, end: planLength }
    for (let idx = 0; idx < planLength - 1; idx++) {
      expect(nextIndex(planLength, idx, wholeBlock, new Set())).toBe(idx + 1)
      expect(nextIndex(planLength, idx, wholeBlock, savedThrough(idx))).toBe(idx + 1)
    }
    const last = planLength - 1
    expect(nextIndex(planLength, last, wholeBlock, new Set())).toBeNull()
    expect(nextIndex(planLength, last, wholeBlock, savedThrough(last))).toBeNull()
  })

  it('после BBB: возврат к пропущенному базовому подходу, не к следующему блоку', () => {
    const bbb = blocks.find(b => b.id === 'g0')!
    const idx = bbb.end - 1
    const saved = new Set<number>([0])
    for (let i = bbb.start; i <= idx; i++) saved.add(i)

    expect(
      nextIndex(planLength, idx, bbb, saved),
    ).toBe(1)
  })

  it('внутри блока — следующий несохранённый индекс после idx', () => {
    const bbb = blocks.find(b => b.id === 'g0')!
    const idx = bbb.start
    const saved = new Set<number>([bbb.start])
    expect(nextIndex(planLength, idx, bbb, saved)).toBe(bbb.start + 1)
  })
})
