import { roundToNearest, calcWeight, calcEstimated1RM, getMainSets, getBBBSets } from './calculator'

describe('roundToNearest', () => {
  it('rounds to nearest 2.5', () => {
    expect(roundToNearest(81)).toBe(82.5)
    expect(roundToNearest(80)).toBe(80)
    expect(roundToNearest(78)).toBe(77.5)
  })
})

describe('calcWeight', () => {
  it('85% of 82.5 rounds correctly', () => {
    expect(calcWeight(82.5, 0.85)).toBe(70)
  })
  it('65% of 82.5 rounds correctly', () => {
    expect(calcWeight(82.5, 0.65)).toBe(52.5)
  })
})

describe('calcEstimated1RM', () => {
  it('Epley formula: 70kg x 9 reps = 91', () => {
    expect(calcEstimated1RM(70, 9)).toBe(91)
  })
})

describe('getMainSets', () => {
  it('week 1: 3 sets, last is AMRAP at 85%', () => {
    const sets = getMainSets(82.5, 1)
    expect(sets).toHaveLength(3)
    expect(sets[2].isAmrap).toBe(true)
    expect(sets[2].plannedWeight).toBe(70)
  })
  it('week 4 deload: no AMRAP sets', () => {
    const sets = getMainSets(82.5, 4)
    expect(sets.every(s => !s.isAmrap)).toBe(true)
  })
})

describe('getBBBSets', () => {
  it('returns 5 sets at 50% TM rounded to 2.5', () => {
    const sets = getBBBSets(82.5)
    expect(sets).toHaveLength(5)
    expect(sets[0].plannedWeight).toBe(40)
    expect(sets[0].plannedReps).toBe(10)
  })
})
