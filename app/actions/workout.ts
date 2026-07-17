'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { LIFTS } from '@/lib/program/constants'

export async function startWorkout(dayType: string, weekNumber: number, cycleNumber: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({ user_id: user.id, day_type: dayType, week_number: weekNumber, cycle_number: cycleNumber })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  redirect(`/workout/${data.id}`)
}

// Пропуск пишется как завершённая сессия без подходов: расписание
// (getNextWorkout) отталкивается от последней завершённой, иначе не сдвинуть.
// Флаг skipped отделяет её от настоящей тренировки — история, статистика и
// «прошлый раз» такие сессии игнорируют.
export async function skipWorkout(dayType: string, weekNumber: number, cycleNumber: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('workout_sessions').insert({
    user_id: user.id,
    day_type: dayType,
    week_number: weekNumber,
    cycle_number: cycleNumber,
    date: today,
    completed_at: new Date().toISOString(),
    skipped: true,
  })
  if (error) throw new Error(error.message)

  revalidatePath('/today')
  revalidatePath('/program')
  redirect('/today')
}

// Пропустить всю неделю разом — актуально для делоада (неделя 4), который
// нужен ради восстановления, а не стимула: отдых даёт то же самое.
// Ставит заглушки на те дни недели, где ещё нет завершённой сессии.
export async function skipWeek(weekNumber: number, cycleNumber: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: done } = await supabase
    .from('workout_sessions')
    .select('day_type')
    .eq('user_id', user.id)
    .eq('week_number', weekNumber)
    .eq('cycle_number', cycleNumber)
    .not('completed_at', 'is', null)

  const doneDays = new Set((done ?? []).map(s => s.day_type))
  const missing = LIFTS.filter(l => !doneDays.has(l))
  if (missing.length === 0) redirect('/today')

  // Даты по порядку лифтов — иначе getNextWorkout возьмёт «последней» не ту
  // сессию и выкинет не на тот день следующей недели.
  const now = Date.now()
  const rows = missing.map((dayType, i) => ({
    user_id: user.id,
    day_type: dayType,
    week_number: weekNumber,
    cycle_number: cycleNumber,
    date: new Date().toISOString().split('T')[0],
    completed_at: new Date(now + i * 1000).toISOString(),
    skipped: true,
  }))

  const { error } = await supabase.from('workout_sessions').insert(rows)
  if (error) throw new Error(error.message)

  revalidatePath('/today')
  revalidatePath('/program')
  redirect('/today')
}

export async function repeatWeek(weekNumber: number, cycleNumber: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_number', weekNumber)
    .eq('cycle_number', cycleNumber)

  if (sessions && sessions.length > 0) {
    const ids = sessions.map(s => s.id)
    await supabase.from('sets').delete().in('session_id', ids)
    await supabase.from('workout_sessions').delete().in('id', ids)
  }

  revalidatePath('/today')
  revalidatePath('/program')
  redirect('/today')
}
