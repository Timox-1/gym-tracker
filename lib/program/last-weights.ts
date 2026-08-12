export type HistorySetRow = {
  exercise: string
  actual_weight_kg: number
  actual_reps: number
  session_id: string
  set_number: number
  completed_at: string
}

/** Последний вес/ср. повторы по каждому упражнению — из самой свежей сессии, где оно было. */
export function pickLastExerciseData(
  rows: HistorySetRow[],
  exercises: string[],
): Record<string, { weight: number; reps: number }> {
  const result: Record<string, { weight: number; reps: number }> = {}

  for (const exercise of exercises) {
    const forExercise = rows.filter(r => r.exercise === exercise)
    if (forExercise.length === 0) continue

    let bestCompletedAt = ''
    let bestSessionId = ''
    for (const row of forExercise) {
      if (row.completed_at > bestCompletedAt) {
        bestCompletedAt = row.completed_at
        bestSessionId = row.session_id
      }
    }

    const setsFromSession = forExercise
      .filter(r => r.session_id === bestSessionId)
      .sort((a, b) => a.set_number - b.set_number)

    const avgReps = Math.round(
      setsFromSession.reduce((sum, s) => sum + s.actual_reps, 0) / setsFromSession.length,
    )
    result[exercise] = { weight: setsFromSession[0].actual_weight_kg, reps: avgReps }
  }

  return result
}
