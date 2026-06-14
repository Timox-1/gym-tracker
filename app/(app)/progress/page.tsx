import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LiftChart } from '@/components/progress/lift-chart'

const LIFTS = [
  { key: 'squat', label: 'Присед' },
  { key: 'bench', label: 'Жим лёжа' },
  { key: 'deadlift', label: 'Становая' },
] as const

export default async function ProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const [{ data: firstSession }, { count: totalSessions }, { data: lastSession }] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select('date')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('workout_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('completed_at', 'is', null),
    supabase
      .from('workout_sessions')
      .select('cycle_number, week_number')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const firstDate = firstSession?.date ? new Date(firstSession.date) : null
  const weeksTraining = firstDate
    ? Math.floor((Date.now() - firstDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 0

  const { data: amrapSets } = await supabase
    .from('sets')
    .select('exercise, estimated_1rm, workout_sessions!inner(date, user_id, day_type)')
    .eq('workout_sessions.user_id', user.id)
    .eq('is_amrap', true)
    .not('estimated_1rm', 'is', null)
    .order('workout_sessions(date)', { ascending: true })

  const charts: Record<string, { date: string; rm: number }[]> = { squat: [], bench: [], deadlift: [] }

  amrapSets?.forEach((s: any) => {
    const dayType = s.workout_sessions?.day_type
    const date = new Date(s.workout_sessions?.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })
    if (charts[dayType]) charts[dayType].push({ date, rm: Math.round(s.estimated_1rm) })
  })

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('date, sets(actual_weight_kg, actual_reps)')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('date', { ascending: false })
    .limit(10)

  const volumeRows = sessions?.map(s => ({
    date: new Date(s.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
    tonnage: (s.sets as any[])?.reduce((sum: number, set: any) =>
      sum + ((set.actual_weight_kg ?? 0) * (set.actual_reps ?? 0)), 0) ?? 0,
  })).reverse() ?? []

  const { data: weightHistory } = await supabase
    .from('body_weights')
    .select('date, weight_kg')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(10)

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Прогресс</h1>
      {firstDate && (
        <div className="bg-gray-900 rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-3xl font-bold text-white">{weeksTraining}</p>
              <p className="text-gray-400 text-xs mt-1">недель</p>
              <p className="text-gray-600 text-xs">
                с {firstDate.toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{totalSessions ?? 0}</p>
              <p className="text-gray-400 text-xs mt-1">тренировок</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{lastSession?.cycle_number ?? 1}</p>
              <p className="text-gray-400 text-xs mt-1">цикл</p>
              <p className="text-gray-600 text-xs">неделя {lastSession?.week_number ?? 1}</p>
            </div>
          </div>
        </div>
      )}
      {LIFTS.map(({ key, label }) => (
        <LiftChart key={key} data={charts[key]} label={label} />
      ))}
      {volumeRows.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-4">
          <p className="text-gray-400 text-sm font-medium mb-3">Тоннаж (кг)</p>
          <div className="space-y-2">
            {volumeRows.map((d, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-400">{d.date}</span>
                <span className="text-white font-medium">{Math.round(d.tonnage).toLocaleString()} кг</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {weightHistory && weightHistory.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-4">
          <p className="text-gray-400 text-sm font-medium mb-3">Вес тела (кг)</p>
          <div className="space-y-2">
            {weightHistory.map((w, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-400">
                  {new Date(w.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                </span>
                <span className="text-white font-medium">{w.weight_kg} кг</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
