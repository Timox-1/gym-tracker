import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getNextWorkout } from '@/lib/program/schedule'
import {
  LIFTS, LIFT_LABELS, ACCESSORY_GROUPS, BBB_COMPANION, BBB_LIFT,
  BBB_SETS, BBB_REPS, BBB_PCT, type Lift, type AnyLift,
} from '@/lib/program/constants'
import { calcWeight, getMainSets } from '@/lib/program/calculator'
import { updateAllTMs } from '@/app/actions/program'
import { RepeatWeekButton } from '@/components/program/repeat-week-button'

const DAY_LABELS: Record<Lift, string> = {
  squat: 'Понедельник',
  bench: 'Среда',
  deadlift: 'Пятница',
}

const WEEK_LABELS: Record<number, string> = {
  1: 'Неделя 1 — 5/5/5+',
  2: 'Неделя 2 — 3/3/3+',
  3: 'Неделя 3 — 5/3/1+',
  4: 'Неделя 4 — Разгрузка',
}

export default async function ProgramPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: tmsData } = await supabase
    .from('training_maxes').select('lift, value_kg').eq('user_id', user.id)
  const tms = Object.fromEntries(
    (tmsData ?? []).map((t: { lift: string; value_kg: number }) => [t.lift, t.value_kg])
  ) as Record<AnyLift, number>

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

  const hasTMs = LIFTS.every(l => tms[l] != null)
  const weekLabel = WEEK_LABELS[next.weekNumber] ?? `Неделя ${next.weekNumber}`

  return (
    <div className="p-4 space-y-6 pb-6">
      <div>
        <p className="text-gray-400 text-sm">{weekLabel} · Цикл {next.cycleNumber}</p>
        <h1 className="text-2xl font-bold">Программа</h1>
      </div>

      <RepeatWeekButton weekNumber={next.weekNumber} cycleNumber={next.cycleNumber} />

      <form action={updateAllTMs} className="bg-gray-900 rounded-2xl p-4 space-y-3">
        <p className="text-sm font-semibold text-gray-300 mb-1">Тренировочные максимумы</p>
        {LIFTS.map(lift => (
          <div key={lift} className="flex items-center gap-3">
            <span className="text-gray-400 text-sm w-24 shrink-0">{LIFT_LABELS[lift]}</span>
            <input
              type="number"
              name={lift}
              defaultValue={tms[lift] ?? ''}
              step="2.5"
              inputMode="decimal"
              placeholder="кг"
              className="flex-1 bg-gray-800 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl py-3 text-sm transition-colors">
          {hasTMs ? 'Сохранить' : 'Сохранить и начать'}
        </button>
        {!hasTMs && (
          <p className="text-yellow-500/90 text-sm text-center">
            Нужны все три. Сейчас: {LIFTS.filter(l => tms[l] != null).length}/3
            {LIFTS.some(l => tms[l] != null) && (
              <> · осталось: {LIFTS.filter(l => tms[l] == null).map(l => LIFT_LABELS[l]).join(', ')}</>
            )}
          </p>
        )}
      </form>

      {hasTMs && LIFTS.map(lift => {
        const mainSets = getMainSets(tms[lift], next.weekNumber as 1 | 2 | 3 | 4)
        const bbbLift = BBB_LIFT[lift]
        const bbbTm = bbbLift === 'rdl' ? tms['deadlift'] : (tms[bbbLift as AnyLift] ?? tms[lift])
        const bbbWeight = calcWeight(bbbTm, BBB_PCT)
        const companion = BBB_COMPANION[lift]

        return (
          <div key={lift} className="bg-gray-900 rounded-2xl p-4 space-y-4">
            <div>
              <p className="text-gray-500 text-xs">{DAY_LABELS[lift]}</p>
              <p className="font-bold text-lg">{LIFT_LABELS[lift]}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">База</p>
              <div className="flex gap-2">
                {mainSets.map((s, i) => (
                  <div key={i} className="flex-1 bg-gray-800 rounded-xl p-2 text-center">
                    <p className="text-white font-bold text-sm">{s.plannedWeight} кг</p>
                    <p className="text-gray-500 text-xs">{s.plannedReps}{s.isAmrap ? '+' : ''} повт</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">BBB + суперсет</p>
              <div className="bg-gray-800 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{LIFT_LABELS[bbbLift]}</span>
                  <span className="text-white font-semibold">{BBB_SETS}×{BBB_REPS} @ {bbbWeight} кг</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-400">↔ {companion.name}</span>
                  <span className="text-gray-400">{BBB_SETS}×{companion.reps}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Аксессуары</p>
              <div className="space-y-2">
                {ACCESSORY_GROUPS[lift].map((group, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-3">
                    {group.type === 'solo' ? (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{group.item.name}</span>
                        <span className="text-gray-400">{group.item.sets}×{group.item.reps}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">{group.a.name}</span>
                          <span className="text-gray-400">{group.a.sets}×{group.a.reps}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-400">↔ {group.b.name}</span>
                          <span className="text-gray-400">{group.b.sets}×{group.b.reps}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
