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

  return (
    <div>
      <div className="p-4 pb-0">
        <p className="text-gray-400 text-sm">Нед. {session.week_number} · Цикл {session.cycle_number}</p>
        <h1 className="text-xl font-bold">{LIFT_LABELS[session.day_type as Lift]}</h1>
      </div>
      <WorkoutClient sessionId={id} plan={plan} />
    </div>
  )
}
