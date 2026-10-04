/** Сопоставить сохранённые сеты с планом и найти индекс, с которого продолжать. */
export function buildResumeState(
  plan: { exercise: string; setNumber: number }[],
  saved: { exercise: string; set_number: number; actual_weight_kg: number; actual_reps: number }[],
): {
  initialIdx: number
  savedActuals: Record<number, { weight: number; reps: number }>
  allDone: boolean
} {
  const savedActuals: Record<number, { weight: number; reps: number }> = {}
  let initialIdx = 0
  let foundGap = false

  for (let i = 0; i < plan.length; i++) {
    const match = saved.find(
      s => s.exercise === plan[i].exercise && s.set_number === plan[i].setNumber,
    )
    if (!match) {
      if (!foundGap) {
        initialIdx = i
        foundGap = true
      }
      continue
    }
    savedActuals[i] = {
      weight: Number(match.actual_weight_kg),
      reps: match.actual_reps,
    }
    if (!foundGap) {
      initialIdx = i + 1
    }
  }

  const allDone = initialIdx >= plan.length && plan.length > 0
  return { initialIdx: allDone ? Math.max(plan.length - 1, 0) : initialIdx, savedActuals, allDone }
}
