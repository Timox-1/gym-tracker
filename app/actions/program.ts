'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { LIFTS } from '@/lib/program/constants'

export async function updateTM(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const lift = formData.get('lift') as string
  const value = parseFloat(formData.get('value') as string)
  if (isNaN(value) || value <= 0) return

  const { error } = await supabase.from('training_maxes').upsert(
    { user_id: user.id, lift, value_kg: value, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,lift' }
  )
  if (error) throw new Error(error.message)
  revalidatePath('/program')
  revalidatePath('/today')
}

/** Сохраняет все заполненные TM одним сабмитом (онбординг + правка). */
export async function updateAllTMs(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const now = new Date().toISOString()
  const rows = LIFTS.flatMap(lift => {
    const value = parseFloat(formData.get(lift) as string)
    if (isNaN(value) || value <= 0) return []
    return [{ user_id: user.id, lift, value_kg: value, updated_at: now }]
  })
  if (rows.length === 0) return

  const { error } = await supabase.from('training_maxes').upsert(rows, {
    onConflict: 'user_id,lift',
  })
  if (error) throw new Error(error.message)

  revalidatePath('/program')
  revalidatePath('/today')

  const { data: saved } = await supabase
    .from('training_maxes')
    .select('lift')
    .eq('user_id', user.id)
    .in('lift', [...LIFTS])

  const complete = LIFTS.every(l => (saved ?? []).some(r => r.lift === l))
  if (complete) redirect('/today')
}

export async function applyProgression() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const increments: Record<string, number> = { squat: 5, deadlift: 5, bench: 2.5, ohp: 2.5 }

  for (const [lift, inc] of Object.entries(increments)) {
    const { data } = await supabase
      .from('training_maxes').select('value_kg')
      .eq('user_id', user.id).eq('lift', lift).single()
    if (data) {
      await supabase.from('training_maxes')
        .update({ value_kg: data.value_kg + inc, updated_at: new Date().toISOString() })
        .eq('user_id', user.id).eq('lift', lift)
    }
  }
  revalidatePath('/program')
  revalidatePath('/today')
}

export async function applyTMSuggestion(lift: string, newTM: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { error } = await supabase.from('training_maxes').upsert(
    { user_id: user.id, lift, value_kg: newTM, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,lift' }
  )
  if (error) throw new Error(error.message)
  revalidatePath('/program')
  revalidatePath('/today')
}
