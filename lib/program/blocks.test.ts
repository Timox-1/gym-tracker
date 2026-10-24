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
        title: 'Выпады назад с гантелями (на каждую ногу; вес одной гантели) + Сгибания ног в тренажёре',
        kind: 'work',
        id: 'g0',
      },
      { title: 'Подтягивания + Брусья', kind: 'work', id: 'g1' },
      { title: 'Молотки + Трицепс', kind: 'work', id: 'g2' },
      { title: 'Шраги за спиной + Подъём ног в висе', kind: 'work', id: 'g3' },
    ])
  })

  it('базовый блок — три рабочих подхода приседа', () => {
    const main = blocks.find(b => b.id === 'main')!
    expect(main.end - main.start).toBe(3)
    expect(plan.slice(main.start, main.end).every(s => s.exercise === 'squat')).toBe(true)
  })

  it('выпады и сгибания — общий блок из трёх пар', () => {
    const legs = blocks.find(b => b.id === 'g0')!
    expect(legs.end - legs.start).toBe(6)
  })

  it('супerset подтягивания — все 5 подходов подтягиваний, включая лишние без пары', () => {
    const pull = blocks.find(b => b.id === 'g1')!
    const slice = plan.slice(pull.start, pull.end)
    const pullUps = slice.filter(s => s.exercise === 'Подтягивания')
    expect(pullUps).toHaveLength(5)
    expect(slice.filter(s => s.exercise === 'Брусья')).toHaveLength(3)
  })

  it('шраги за спиной стартуют с 30 кг, пока нет прошлого веса', () => {
    const shrugs = plan.filter(s => s.exercise === 'Шраги за спиной')
    expect(shrugs).toHaveLength(3)
    expect(shrugs.every(s => s.plannedWeight === 30)).toBe(true)
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
