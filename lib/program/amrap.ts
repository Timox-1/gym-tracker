import { calcEstimated1RM } from './calculator'

export const AMRAP_TARGETS: Record<number, string> = {
  1: '5–8 повт',
  2: '3–6 повт',
  3: '1+ повт',
}

/** Сохранённый факт — общий источник для обычного завершения и resume. */
export function getAmrapFeedback(
  plan: { isAmrap: boolean }[],
  saved: Record<number, { weight: number; reps: number }>,
  weekNumber: number,
  mainTM: number,
) {
  const index = plan.findIndex(set => set.isAmrap)
  const actual = saved[index]
  const reps = actual?.reps ?? null
  const rm = actual && actual.reps > 0 ? calcEstimated1RM(actual.weight, actual.reps) : null
  const suggested = rm !== null ? Math.round((rm * 0.9) / 2.5) * 2.5 : null
  return {
    reps,
    rm,
    checkTM: weekNumber === 3 && reps === 0,
    tmSuggestion: weekNumber === 3 && reps !== null && reps > 8 && suggested !== null
      && Math.abs(suggested - mainTM) >= 5 ? suggested : null,
  }
}
