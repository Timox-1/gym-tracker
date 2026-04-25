'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-white mb-1 text-center">💪 Gym Tracker</h1>
        <p className="text-gray-400 text-center mb-8">Дневник тренировок</p>
        {sent ? (
          <div className="bg-gray-800 rounded-2xl p-6 text-center">
            <p className="text-green-400 text-lg font-medium">Проверь почту</p>
            <p className="text-gray-400 mt-2 text-sm">Ссылка отправлена на {email}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-2xl py-4 text-lg transition-colors"
            >
              {loading ? 'Отправляем...' : 'Войти'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
