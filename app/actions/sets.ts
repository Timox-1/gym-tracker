'use server'
import { createClient } from '@/lib/supabase/server'
import { calcEstimated1RM } from '@/lib/program/calculator'
import { revalidatePath } from 'next/cache'

export async function saveSet(params: {
  sessionId: string
  exercise: string
  setNumber: number
  plannedReps: number | null
  plannedWeightKg: number | null
  actualReps: number
  actualWeightKg: number
  isAmrap: boolean
}) {
  const supabase = await createClient()
  const estimated1rm = params.isAmrap
    ? calcEstimated1RM(params.actualWeightKg, params.actualReps)
    : null

  const { error } = await supabase.from('sets').upsert({
    session_id: params.sessionId,
    exercise: params.exercise,
    set_number: params.setNumber,
    planned_reps: params.plannedReps,
    planned_weight_kg: params.plannedWeightKg,
    actual_reps: params.actualReps,
    actual_weight_kg: params.actualWeightKg,
    is_amrap: params.isAmrap,
    estimated_1rm: estimated1rm,
  }, { onConflict: 'session_id,exercise,set_number' })
  if (error) throw new Error(error.message)
  revalidatePath('/history')
}

export async function completeWorkout(sessionId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('workout_sessions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', sessionId)

  if (error) {
    console.error('completeWorkout error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/history')
  revalidatePath('/progress')
  revalidatePath('/today')
}
