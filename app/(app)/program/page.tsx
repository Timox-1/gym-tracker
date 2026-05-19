import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateTM, applyProgression } from '@/app/actions/program'
import { logBodyWeight } from '@/app/actions/bodyweight'
import { LIFT_LABELS } from '@/lib/program/constants'

const LIFTS = ['squat', 'bench', 'deadlift'] as const

export default async function ProgramPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: tmsData } = await supabase
    .from('training_maxes').select('lift, value_kg').eq('user_id', user.id)
  const tms = Object.fromEntries((tmsData ?? []).map(t => [t.lift, t.value_kg]))

  const { data: lastSession } = await supabase
    .from('workout_sessions').select('week_number, day_type')
    .eq('user_id', user.id).not('completed_at', 'is', null)
    .order('date', { ascending: false }).limit(1).maybeSingle()

  const showProgression = lastSession?.week_number === 4 && lastSession?.day_type === 'deadlift'

  const { data: lastWeight } = await supabase
    .from('body_weights')
    .select('weight_kg')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Программа</h1>

      {showProgression && (
        <div className="bg-green-900/30 border border-green-700 rounded-2xl p-4 space-y-3">
          <p className="text-green-400 font-semibold">Цикл завершён! 🎉</p>
          <p className="text-gray-300 text-sm">Добавить прогрессию к максимумам?</p>
          <form action={applyProgression}>
            <button type="submit"
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl py-3 transition-colors">
              Да — +5кг присед/становая, +2.5кг жим
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-gray-300 font-semibold">Тренировочные максимумы (TM)</h2>
        {LIFTS.map(lift => (
          <form key={lift} action={updateTM}
            className="bg-gray-900 rounded-2xl p-4 flex items-center gap-3">
            <input type="hidden" name="lift" value={lift} />
            <span className="text-gray-300 flex-1 text-sm">{LIFT_LABELS[lift]}</span>
            <input name="value" type="number" defaultValue={tms[lift] ?? ''} step="2.5"
              inputMode="decimal" placeholder="кг"
              className="bg-gray-800 text-white w-20 rounded-xl px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-3 py-2 text-sm font-medium transition-colors">
              ✓
            </button>
          </form>
        ))}
      </div>

      <div className="bg-gray-900 rounded-2xl p-4 space-y-1">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Схема</p>
        <p className="text-gray-300 text-sm">5/3/1 BBB · 3 дня · 4-недельные циклы</p>
        <p className="text-gray-500 text-xs">Пн: Присед · Ср: Жим · Пт: Становая</p>
        <p className="text-gray-500 text-xs">BBB: 5×10 @ 50% TM после основных сетов</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-gray-300 font-semibold">Вес тела</h2>
        <form action={logBodyWeight} className="bg-gray-900 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-gray-300 flex-1 text-sm">
            {lastWeight ? `Последний: ${lastWeight.weight_kg} кг` : 'Не записан'}
          </span>
          <input name="weight" type="number" step="0.1" inputMode="decimal" placeholder="кг"
            defaultValue={lastWeight?.weight_kg ?? ''}
            className="bg-gray-800 text-white w-20 rounded-xl px-3 py-2 text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-3 py-2 text-sm font-medium transition-colors">
            ✓
          </button>
        </form>
      </div>
    </div>
  )
}
