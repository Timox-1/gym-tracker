'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveSet, completeWorkout } from '@/app/actions/sets'
import { calcEstimated1RM } from '@/lib/program/calculator'
import type { PlannedSet } from '@/lib/program/workout-builder'

export function WorkoutClient({ sessionId, plan }: { sessionId: string; plan: PlannedSet[] }) {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [weight, setWeight] = useState(String(plan[0]?.plannedWeight ?? ''))
  const [reps, setReps] = useState(String(plan[0]?.plannedReps ?? ''))
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [amrapRM, setAmrapRM] = useState<number | null>(null)

  const current = plan[idx]
  const isLast = idx === plan.length - 1
  const progress = Math.round((idx / plan.length) * 100)

  async function handleConfirm() {
    setSaving(true)
    const actualWeight = parseFloat(weight) || 0
    const actualReps = parseInt(reps) || 0

    await saveSet({
      sessionId,
      exercise: current.exercise,
      setNumber: current.setNumber,
      plannedReps: current.plannedReps,
      plannedWeightKg: current.plannedWeight,
      actualReps,
      actualWeightKg: actualWeight,
      isAmrap: current.isAmrap,
    })

    if (current.isAmrap && actualReps > 0) {
      setAmrapRM(calcEstimated1RM(actualWeight, actualReps))
    } else {
      setAmrapRM(null)
    }

    if (isLast) {
      await completeWorkout(sessionId)
      setDone(true)
    } else {
      const next = plan[idx + 1]
      setIdx(idx + 1)
      setWeight(String(next.plannedWeight ?? ''))
      setReps(String(next.plannedReps))
    }
    setSaving(false)
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center gap-4">
        <div className="text-6xl">💪</div>
        <h2 className="text-2xl font-bold">Тренировка завершена!</h2>
        <button onClick={() => router.push('/today')}
          className="bg-blue-600 text-white font-bold rounded-2xl px-8 py-4 text-lg">
          На главную
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="h-1 bg-gray-800 rounded-full">
        <div className="h-1 bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-gray-400 text-sm">{idx + 1} / {plan.length}</p>

      <div className="bg-gray-900 rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-gray-400 text-sm">{current.exerciseLabel}</p>
          <p className="font-semibold text-lg">
            Сет {current.setNumber}
            {current.isAmrap && <span className="text-yellow-400 ml-2">AMRAP</span>}
            {current.isAccessory && <span className="text-gray-500 ml-2 text-sm">(аксессуар)</span>}
          </p>
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-1">Вес (кг)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
            step="2.5" inputMode="decimal"
            className="w-full bg-gray-800 text-white text-2xl font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-1">
            {current.isAmrap ? 'Повторения (сколько смог)' : `Повторения (план: ${current.plannedReps})`}
          </label>
          <input type="number" value={reps} onChange={e => setReps(e.target.value)}
            inputMode="numeric"
            className="w-full bg-gray-800 text-white text-2xl font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {amrapRM && (
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-3 text-center">
            <p className="text-green-400 text-sm">Расчётный максимум</p>
            <p className="text-green-300 text-2xl font-bold">~{amrapRM} кг</p>
          </div>
        )}
      </div>

      <button onClick={handleConfirm} disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl py-5 text-xl transition-colors">
        {saving ? 'Сохраняем...' : isLast ? 'Завершить тренировку' : 'Сет выполнен →'}
      </button>

      {idx > 0 && (
        <button onClick={() => {
          const prev = plan[idx - 1]
          setIdx(idx - 1)
          setWeight(String(prev.plannedWeight ?? ''))
          setReps(String(prev.plannedReps))
          setAmrapRM(null)
        }} className="w-full text-gray-500 py-2 text-sm">
          ← Назад
        </button>
      )}
    </div>
  )
}
