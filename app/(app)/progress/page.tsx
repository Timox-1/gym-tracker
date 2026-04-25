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

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Прогресс</h1>
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
    </div>
  )
}
