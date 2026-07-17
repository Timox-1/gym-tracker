import { calcWeight, calcDeloadWeight, calcEstimated1RM, getMainSets, getBBBSets } from './calculator'

describe('calcWeight — рабочие недели, до ближайшего', () => {
  it('округляет вверх, когда ближе к верхнему блину', () => {
    // 105 × 0.95 = 99.75 → 100. Раньше floor давал 97.5 (недогруз 2.25)
    expect(calcWeight(105, 0.95)).toBe(100)
    expect(calcWeight(105, 0.85)).toBe(90)
  })
  it('округляет вниз, когда ближе к нижнему блину', () => {
    expect(calcWeight(90, 0.9)).toBe(80)   // 81 → 80
    expect(calcWeight(82.5, 0.65)).toBe(52.5) // 53.625 → 52.5
  })
  it('точное попадание на шаг не двигается', () => {
    expect(calcWeight(90, 0.5)).toBe(45)
    expect(calcWeight(100, 0.75)).toBe(75)
  })
})

describe('calcDeloadWeight — неделя 4, вниз', () => {
  it('всегда округляет вниз, чтобы делоад не тяжелел', () => {
    expect(calcDeloadWeight(105, 0.4)).toBe(40)    // 42 → 40 (round дал бы 42.5)
    expect(calcDeloadWeight(97.5, 0.5)).toBe(47.5) // 48.75 → 47.5 (round дал бы 50)
  })
  it('никогда не превышает calcWeight', () => {
    for (const tm of [87.5, 90, 97.5, 102.5, 105]) {
      for (const pct of [0.4, 0.5, 0.6]) {
        expect(calcDeloadWeight(tm, pct)).toBeLessThanOrEqual(calcWeight(tm, pct))
      }
    }
  })
})

describe('calcEstimated1RM', () => {
  it('Epley: 70кг × 9 повт = 91', () => {
    expect(calcEstimated1RM(70, 9)).toBe(91)
  })
})

describe('getMainSets', () => {
  it('неделя 1: 3 сета, последний AMRAP на 85%', () => {
    const sets = getMainSets(82.5, 1)
    expect(sets).toHaveLength(3)
    expect(sets[2].isAmrap).toBe(true)
    expect(sets[2].plannedWeight).toBe(70)
  })
  it('неделя 4 — делоад, без AMRAP', () => {
    const sets = getMainSets(82.5, 4)
    expect(sets.every(s => !s.isAmrap)).toBe(true)
  })
  it('неделя 4 использует округление вниз, недели 1–3 — до ближайшего', () => {
    // TM 105: нед.4 40% = 42 → floor 40. Если бы применялся round, было бы 42.5
    expect(getMainSets(105, 4)[0].plannedWeight).toBe(40)
    // нед.3 95% = 99.75 → round 100
    expect(getMainSets(105, 3)[2].plannedWeight).toBe(100)
  })
  it('становая TM 102.5 нед.3 повторяет прежние веса (TM 105 + floor)', () => {
    // легализация: старый баг держал фактический TM на 102.5
    expect(getMainSets(102.5, 3).map(s => s.plannedWeight)).toEqual([77.5, 87.5, 97.5])
  })
})

describe('getBBBSets', () => {
  it('5 сетов на 50% TM', () => {
    const sets = getBBBSets(82.5)
    expect(sets).toHaveLength(5)
    expect(sets[0].plannedWeight).toBe(42.5) // 41.25 → до ближайшего 42.5
    expect(sets[0].plannedReps).toBe(10)
  })
  it('BBB-присед на дне становой: 50% от TM приседа 97.5 → 50', () => {
    // раньше floor давал 47.5, а по факту всегда делалось 50
    expect(getBBBSets(97.5)[0].plannedWeight).toBe(50)
  })
})
