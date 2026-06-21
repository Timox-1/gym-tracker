'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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

export async function skipWorkout(dayType: string, weekNumber: number, cycleNumber: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const today = new Date().toISOString().split('T')[0]
  await supabase.from('workout_sessions').insert({
    user_id: user.id,
    day_type: dayType,
    week_number: weekNumber,
    cycle_number: cycleNumber,
    date: today,
    completed_at: new Date().toISOString(),
  })
  revalidatePath('/today')
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
