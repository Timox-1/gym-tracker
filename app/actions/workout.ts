'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
