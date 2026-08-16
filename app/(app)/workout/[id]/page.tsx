import { createClient } from '@/lib/supabase/server'
import { buildWorkoutPlan } from '@/lib/program/workout-builder'
import { pickLastExerciseData } from '@/lib/program/last-weights'
import { buildResumeState } from '@/lib/program/resume'
import { WorkoutClient } from '@/components/workout/workout-client'
import { LIFT_LABELS, type Lift, type AnyLift } from '@/lib/program/constants'
import { redirect, notFound } from 'next/navigation'

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: session } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) notFound()
  if (session.completed_at) redirect('/today')

  const { data: tmsData } = await supabase
    .from('training_maxes').select('lift, value_kg').eq('user_id', user.id)

  const tms = Object.fromEntries((tmsData ?? []).map((t: { lift: string; value_kg: number }) => [t.lift, t.value_kg])) as Record<AnyLift, number>
  const plan = buildWorkoutPlan(session.day_type as Lift, session.week_number as 1|2|3|4, tms)

  const mainTM: number = tms[session.day_type as keyof typeof tms] ?? 0

  const { data: bestSet } = await supabase
    .from('sets')
    .select('estimated_1rm, workout_sessions!inner(day_type, user_id)')
    .eq('workout_sessions.user_id', user.id)
    .eq('workout_sessions.day_type', session.day_type)
    .eq('is_amrap', true)
    .not('estimated_1rm', 'is', null)
    .neq('session_id', id)
    .order('estimated_1rm', { ascending: false })
    .limit(1)
    .maybeSingle()

  const historicalBest1RM: number | null = bestSet ? Math.round((bestSet as any).estimated_1rm) : null

  // Прошлый вес аксессуаров/BBB — по упражнению из самой свежей сессии, где оно было.
  // Не «последние N любых дней»: после отдыха/пропусков полная та же тренировка
  // вылетала из окна, и поля весов становились пустыми со второй половины.
  const historyExercises = [...new Set(plan.filter(s => s.isAccessory || s.isBBB).map(s => s.exercise))]
  let lastDataMap: Record<string, { weight: number; reps: number }> = {}

  if (historyExercises.length > 0) {
    const { data: lastSets } = await supabase
      .from('sets')
      .select('exercise, actual_weight_kg, actual_reps, session_id, set_number, workout_sessions!inner(user_id, completed_at, skipped)')
      .eq('workout_sessions.user_id', user.id)
      .eq('workout_sessions.skipped', false)
      .not('workout_sessions.completed_at', 'is', null)
      .neq('session_id', id)
      .in('exercise', historyExercises)
      .not('actual_weight_kg', 'is', null)
      .gt('actual_weight_kg', 0)

    if (lastSets) {
      type SetRow = {
        exercise: string
        actual_weight_kg: number
        actual_reps: number
        session_id: string
        set_number: number
        workout_sessions: { completed_at: string } | { completed_at: string }[]
      }
      const rows = (lastSets as SetRow[]).map(s => {
        const ws = Array.isArray(s.workout_sessions) ? s.workout_sessions[0] : s.workout_sessions
        return {
          exercise: s.exercise,
          actual_weight_kg: s.actual_weight_kg,
          actual_reps: s.actual_reps,
          session_id: s.session_id,
          set_number: s.set_number,
          completed_at: ws.completed_at,
        }
      })
      lastDataMap = pickLastExerciseData(rows, historyExercises)
    }
  }

  const planWithHistory = plan.map(s =>
    (s.isAccessory || s.isBBB) && lastDataMap[s.exercise] != null
      ? { ...s, lastWeight: lastDataMap[s.exercise].weight, lastReps: lastDataMap[s.exercise].reps }
      : s
  )

  const { data: existingSets } = await supabase
    .from('sets')
    .select('exercise, set_number, actual_weight_kg, actual_reps')
    .eq('session_id', id)

  const resume = buildResumeState(planWithHistory, existingSets ?? [])

  return (
    <div>
      <div className="p-4 pb-0">
        <p className="text-gray-400 text-sm">Нед. {session.week_number} · Цикл {session.cycle_number}</p>
        <h1 className="text-xl font-bold">{LIFT_LABELS[session.day_type as Lift]}</h1>
        {resume.initialIdx > 0 && !resume.allDone && (
          <p className="text-blue-400 text-sm mt-1">
            Продолжение · сет {resume.initialIdx + 1} из {planWithHistory.length}
          </p>
        )}
      </div>
      <WorkoutClient
          sessionId={id}
          plan={planWithHistory}
          weekNumber={session.week_number as 1|2|3|4}
          dayType={session.day_type}
          mainTM={mainTM}
          historicalBest1RM={historicalBest1RM}
          initialIdx={resume.initialIdx}
          initialSavedActuals={resume.savedActuals}
          startDone={resume.allDone}
        />
    </div>
  )
}
