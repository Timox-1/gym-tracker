import { AMRAP_TARGETS, getAmrapFeedback } from './amrap'
import { buildResumeState } from './resume'

const plan = [{ exercise: 'squat', setNumber: 3, isAmrap: true }]

describe('AMRAP третьей недели', () => {
  it('показывает цель 1+', () => {
    expect(AMRAP_TARGETS[3]).toBe('1+ повт')
  })

  it.each([1, 2, 8])('%i повторов не вызывает совет менять TM', reps => {
    expect(getAmrapFeedback(plan, { 0: { weight: 95, reps } }, 3, 100))
      .toMatchObject({ checkTM: false, tmSuggestion: null })
  })

  it('при 0 предлагает проверку без расчёта силы и нового TM', () => {
    expect(getAmrapFeedback(plan, { 0: { weight: 95, reps: 0 } }, 3, 100))
      .toMatchObject({ rm: null, checkTM: true, tmSuggestion: null })
  })

  it('при 9 сохраняет совет и минимальную разницу 5 кг', () => {
    expect(getAmrapFeedback(plan, { 0: { weight: 95, reps: 9 } }, 3, 100).tmSuggestion).toBe(112.5)
    expect(getAmrapFeedback(plan, { 0: { weight: 95, reps: 9 } }, 3, 110).tmSuggestion).toBeNull()
  })

  it.each([1, 2, 4])('не советует TM на неделе %i', week => {
    expect(getAmrapFeedback(plan, { 0: { weight: 95, reps: 9 } }, week, 100).tmSuggestion).toBeNull()
  })

  it.each([0, 1, 2, 8, 9])('resume восстанавливает тот же результат для %i повторов', reps => {
    const saved = [{ exercise: 'squat', set_number: 3, actual_weight_kg: 95, actual_reps: reps }]
    const resumed = buildResumeState(plan, saved)
    expect(getAmrapFeedback(plan, resumed.savedActuals, 3, 100))
      .toEqual(getAmrapFeedback(plan, { 0: { weight: 95, reps } }, 3, 100))
  })

  it('повторная запись 2 повторов убирает прежний совет для 9', () => {
    const saved = { 0: { weight: 95, reps: 9 } }
    saved[0] = { weight: 95, reps: 2 }
    expect(getAmrapFeedback(plan, saved, 3, 100).tmSuggestion).toBeNull()
  })

  it('нет результата до сохранения AMRAP', () => {
    expect(getAmrapFeedback(plan, {}, 3, 100)).toEqual({ reps: null, rm: null, checkTM: false, tmSuggestion: null })
  })
})
