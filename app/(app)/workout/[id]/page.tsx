import { createClient } from '@/lib/supabase/server'
import { buildWorkoutPlan } from '@/lib/program/workout-builder'
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

  // Inject last-session weights for accessory and BBB exercises
  const historyExercises = [...new Set(plan.filter(s => s.isAccessory || s.isBBB).map(s => s.exercise))]
  type LastData = { weight: number; reps: number }
  const lastDataMap: Record<string, LastData> = {}

  if (historyExercises.length > 0) {
    const { data: recentSessions } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('user_id', user.id)
      .neq('id', id)
      .not('completed_at', 'is', null)
      .order('date', { ascending: false })
      .limit(5)

    if (recentSessions && recentSessions.length > 0) {
      const sessionIds = recentSessions.map((s: { id: string }) => s.id)
      const { data: lastSets } = await supabase
        .from('sets')
        .select('exercise, actual_weight_kg, actual_reps, session_id')
        .in('session_id', sessionIds)
        .in('exercise', historyExercises)
        .not('actual_weight_kg', 'is', null)
        .gt('actual_weight_kg', 0)

      if (lastSets) {
        type SetRow = { exercise: string; actual_weight_kg: number; actual_reps: number; session_id: string }
        for (const exercise of historyExercises) {
          const exerciseSets = (lastSets as SetRow[]).filter(s => s.exercise === exercise)
          for (const sessionId of sessionIds) {
            const setsFromSession = exerciseSets.filter(s => s.session_id === sessionId)
            if (setsFromSession.length > 0) {
              const avgReps = Math.round(setsFromSession.reduce((sum, s) => sum + s.actual_reps, 0) / setsFromSession.length)
              lastDataMap[exercise] = { weight: setsFromSession[0].actual_weight_kg, reps: avgReps }
              break
            }
          }
        }
      }
    }
  }

  const planWithHistory = plan.map(s =>
    (s.isAccessory || s.isBBB) && lastDataMap[s.exercise] != null
      ? { ...s, lastWeight: lastDataMap[s.exercise].weight, lastReps: lastDataMap[s.exercise].reps }
      : s
  )

  return (
    <div>
      <div className="p-4 pb-0">
        <p className="text-gray-400 text-sm">Нед. {session.week_number} · Цикл {session.cycle_number}</p>
        <h1 className="text-xl font-bold">{LIFT_LABELS[session.day_type as Lift]}</h1>
      </div>
      <WorkoutClient
          sessionId={id}
          plan={planWithHistory}
          weekNumber={session.week_number as 1|2|3|4}
          dayType={session.day_type}
          mainTM={mainTM}
          historicalBest1RM={historicalBest1RM}
        />
    </div>
  )
}
