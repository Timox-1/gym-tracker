import { buildWorkoutPlan } from './workout-builder'
import { planBlocks } from './blocks'
import type { AnyLift } from './constants'

const TMS = {
  squat: 105,
  bench: 95,
  deadlift: 120,
  ohp: 30,
  rdl: 120,
} as Record<AnyLift, number>

describe('planBlocks', () => {
  const plan = buildWorkoutPlan('squat', 1, TMS)
  const blocks = planBlocks(plan)

  it('день приседа неделя 1 — ожидаемые блоки и заголовки', () => {
    expect(blocks.map(b => ({ title: b.title, kind: b.kind, id: b.id }))).toEqual([
      { title: 'Присед', kind: 'main', id: 'main' },
      {
        title: 'Румынская тяга (BBB) + Разгибания ног',
        kind: 'work',
        id: 'g0',
      },
      { title: 'Подтягивания + Брусья', kind: 'work', id: 'g1' },
      { title: 'Молотки + Трицепс', kind: 'work', id: 'g2' },
      { title: 'Подъём ног в висе', kind: 'work', id: 'solo-27' },
    ])
  })

  it('базовый блок — три рабочих подхода приседа', () => {
    const main = blocks.find(b => b.id === 'main')!
    expect(main.end - main.start).toBe(3)
    expect(plan.slice(main.start, main.end).every(s => s.exercise === 'squat')).toBe(true)
  })

  it('BBB — десять сетов (5 пар)', () => {
    const bbb = blocks.find(b => b.id === 'g0')!
    expect(bbb.end - bbb.start).toBe(10)
  })

  it('супerset подтягивания — все 5 подходов подтягиваний, включая лишние без пары', () => {
    const pull = blocks.find(b => b.id === 'g1')!
    const slice = plan.slice(pull.start, pull.end)
    const pullUps = slice.filter(s => s.exercise === 'Подтягивания')
    expect(pullUps).toHaveLength(5)
    expect(slice.filter(s => s.exercise === 'Брусья')).toHaveLength(3)
  })

  it('блоки покрывают каждый индекс ровно один раз по порядку', () => {
    let cursor = 0
    for (const b of blocks) {
      expect(b.start).toBe(cursor)
      cursor = b.end
    }
    expect(cursor).toBe(plan.length)
  })
})
