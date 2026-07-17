import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LIFT_LABELS, type AnyLift } from '@/lib/program/constants'

function getExerciseLabel(exercise: string): string {
  if (exercise.endsWith('_bbb')) {
    const base = exercise.replace('_bbb', '') as AnyLift
    return `${LIFT_LABELS[base] ?? base} (BBB)`
  }
  return LIFT_LABELS[exercise as AnyLift] ?? exercise
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id, date, day_type, week_number, cycle_number, sets(exercise, set_number, actual_weight_kg, actual_reps, is_amrap, estimated_1rm)')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .eq('skipped', false)
    .order('date', { ascending: false })
    .limit(20)

  return (
    <div className="p-4 space-y-3">
      <h1 className="text-2xl font-bold">История</h1>
      {(!sessions || sessions.length === 0) && (
        <p className="text-gray-400">Завершённые тренировки появятся здесь</p>
      )}
      {sessions?.map(session => {
        const date = new Date(session.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })
        const amrap = (session.sets as any[])?.find((s: any) => s.is_amrap && s.estimated_1rm)
        return (
          <div key={session.id} className="bg-gray-900 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{LIFT_LABELS[session.day_type as AnyLift] ?? session.day_type}</p>
                <p className="text-gray-400 text-sm">{date} · Нед. {session.week_number} · Цикл {session.cycle_number}</p>
              </div>
              {amrap && (
                <div className="text-right">
                  <p className="text-green-400 font-bold">{amrap.estimated_1rm} кг</p>
                  <p className="text-gray-500 text-xs">расч. 1RM</p>
                </div>
              )}
            </div>
            <div className="space-y-1">
              {(session.sets as any[])?.slice(0, 4).map((s: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-500">{getExerciseLabel(s.exercise)} · {s.set_number}</span>
                  <span className="text-gray-300">{s.actual_weight_kg}кг × {s.actual_reps}{s.is_amrap ? ' ★' : ''}</span>
                </div>
              ))}
              {((session.sets as any[])?.length ?? 0) > 4 && (
                <p className="text-gray-600 text-xs">ещё {((session.sets as any[])?.length ?? 0) - 4} сетов</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
