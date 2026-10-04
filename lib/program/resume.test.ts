import { buildResumeState } from './resume'

describe('buildResumeState', () => {
  const plan = [
    { exercise: 'deadlift', setNumber: 1 },
    { exercise: 'deadlift', setNumber: 2 },
    { exercise: 'deadlift', setNumber: 3 },
    { exercise: 'squat_bbb', setNumber: 1 },
    { exercise: 'Икры', setNumber: 1 },
  ]

  it('начинает с нуля, если сетов нет', () => {
    expect(buildResumeState(plan, [])).toEqual({
      initialIdx: 0,
      savedActuals: {},
      allDone: false,
    })
  })

  it('продолжает после последнего непрерывного сохранённого сета', () => {
    const saved = [
      { exercise: 'deadlift', set_number: 1, actual_weight_kg: 67.5, actual_reps: 5 },
      { exercise: 'deadlift', set_number: 2, actual_weight_kg: 80, actual_reps: 5 },
      { exercise: 'deadlift', set_number: 3, actual_weight_kg: 90, actual_reps: 8 },
    ]
    const state = buildResumeState(plan, saved)
    expect(state.initialIdx).toBe(3)
    expect(state.allDone).toBe(false)
    expect(state.savedActuals[0]).toEqual({ weight: 67.5, reps: 5 })
    expect(state.savedActuals[2]).toEqual({ weight: 90, reps: 8 })
    expect(state.savedActuals[3]).toBeUndefined()
  })

  it('останавливается на первом пропуске в середине', () => {
    const saved = [
      { exercise: 'deadlift', set_number: 1, actual_weight_kg: 67.5, actual_reps: 5 },
      { exercise: 'deadlift', set_number: 3, actual_weight_kg: 90, actual_reps: 8 },
    ]
    const state = buildResumeState(plan, saved)
    expect(state.initialIdx).toBe(1)
    expect(state.savedActuals[0]).toEqual({ weight: 67.5, reps: 5 })
    expect(state.savedActuals[2]).toEqual({ weight: 90, reps: 8 })
  })

  it('помечает allDone, если все сеты сохранены', () => {
    const saved = plan.map((p, i) => ({
      exercise: p.exercise,
      set_number: p.setNumber,
      actual_weight_kg: 10 + i,
      actual_reps: 8,
    }))
    const state = buildResumeState(plan, saved)
    expect(state.allDone).toBe(true)
    expect(state.initialIdx).toBe(plan.length - 1)
    expect(Object.keys(state.savedActuals)).toHaveLength(5)
  })
})
