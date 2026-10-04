import { createClient } from '@/lib/supabase/server'
import { getNextWorkout } from '@/lib/program/schedule'
import { buildWorkoutPlan } from '@/lib/program/workout-builder'
import { pickLastExerciseData } from '@/lib/program/last-weights'
import { LIFT_LABELS, type Lift, type AnyLift } from '@/lib/program/constants'
import { TodayActions } from '@/components/today/today-actions'
import { TodayPlanButton } from '@/components/today/today-plan-button'
import { redirect } from 'next/navigation'

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: lastSession } = await supabase
    .from('workout_sessions')
    .select('day_type, week_number, cycle_number')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const next = getNextWorkout(lastSession ? {
    dayType: lastSession.day_type,
    weekNumber: lastSession.week_number,
    cycleNumber: lastSession.cycle_number,
  } : null)

  const { data: tmsData } = await supabase
    .from('training_maxes')
    .select('lift, value_kg')
    .eq('user_id', user.id)

  const tms = Object.fromEntries((tmsData ?? []).map(t => [t.lift, t.value_kg])) as Record<AnyLift, number>
  const hasTMs = ['squat', 'bench', 'deadlift'].every(l => tms[l as AnyLift] != null)

  const plan = hasTMs ? buildWorkoutPlan(next.dayType as Lift, next.weekNumber, tms) : []
  const historyExercises = [...new Set(plan.filter(s => s.isAccessory || s.isBBB).map(s => s.exercise))]
  let lastDataMap: Record<string, { weight: number; reps: number }> = {}
  if (historyExercises.length > 0) {
    const { data: lastSets } = await supabase
      .from('sets')
      .select('exercise, actual_weight_kg, actual_reps, session_id, set_number, workout_sessions!inner(user_id, completed_at, skipped)')
      .eq('workout_sessions.user_id', user.id)
      .eq('workout_sessions.skipped', false)
      .not('workout_sessions.completed_at', 'is', null)
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
  const planDetailed = plan.map(s =>
    (s.isAccessory || s.isBBB) && lastDataMap[s.exercise] != null
      ? { ...s, lastWeight: lastDataMap[s.exercise].weight, lastReps: lastDataMap[s.exercise].reps }
      : s
  )
  const weekLabel = next.weekNumber === 4 ? 'Неделя 4 — Разгрузка' : `Неделя ${next.weekNumber}`

  const { data: activeSession } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('day_type', next.dayType)
    .eq('week_number', next.weekNumber)
    .eq('cycle_number', next.cycleNumber)
    .is('completed_at', null)
    .eq('skipped', false)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  let savedSetCount = 0
  if (activeSession) {
    const { count } = await supabase
      .from('sets')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', activeSession.id)
    savedSetCount = count ?? 0
  }

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <p className="text-gray-400 text-sm">{weekLabel} · Цикл {next.cycleNumber}</p>
        <h1 className="text-2xl font-bold mt-1">{LIFT_LABELS[next.dayType as Lift]}</h1>
      </div>

      {!hasTMs && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-2xl p-4 space-y-1">
          <p className="text-yellow-400 text-sm">
            Сначала задай все три максимума (присед, жим, становая) в ⚙️ Программа
          </p>
          <p className="text-yellow-600 text-xs">
            Сейчас: {['squat', 'bench', 'deadlift'].filter(l => tms[l as AnyLift] != null).length}/3
          </p>
        </div>
      )}

      {hasTMs && (
        <>
          <div className="space-y-2">
            {plan.slice(0, 8).map((s, i) => (
              <div key={i} className="bg-gray-900 rounded-xl px-4 py-3 flex justify-between">
                <span className="text-gray-400 text-sm">{s.exerciseLabel} · {s.setNumber}</span>
                <span className="font-semibold text-sm">
                  {s.plannedWeight != null ? `${s.plannedWeight}кг × ` : ''}{s.plannedReps}{s.isAmrap ? '+' : ''}
                </span>
              </div>
            ))}
            {plan.length > 8 && (
              <p className="text-gray-500 text-sm text-center">...ещё {plan.length - 8} сетов</p>
            )}
          </div>
          <TodayPlanButton plan={planDetailed} />
          <TodayActions
            dayType={next.dayType}
            weekNumber={next.weekNumber}
            cycleNumber={next.cycleNumber}
            activeSessionId={activeSession?.id ?? null}
            savedSetCount={savedSetCount}
            planSetCount={plan.length}
          />
        </>
      )}
    </div>
  )
}
