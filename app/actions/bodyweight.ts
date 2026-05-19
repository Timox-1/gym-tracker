'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function logBodyWeight(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const weight = parseFloat(formData.get('weight') as string)
  if (isNaN(weight) || weight <= 0) return

  const today = new Date().toISOString().split('T')[0]
  await supabase.from('body_weights').upsert(
    { user_id: user.id, date: today, weight_kg: weight },
    { onConflict: 'user_id,date' }
  )
  revalidatePath('/program')
  revalidatePath('/progress')
}
