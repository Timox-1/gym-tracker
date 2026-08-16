'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { saveSet, completeWorkout } from '@/app/actions/sets'
import { calcEstimated1RM } from '@/lib/program/calculator'
import type { PlannedSet } from '@/lib/program/workout-builder'
import { applyTMSuggestion } from '@/app/actions/program'

function getRestSeconds(set: PlannedSet): number {
  if (set.isAccessory) return 90
  if (set.exerciseLabel.includes('BBB')) return 120
  return 180
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

// Стартовый вес в поле ввода.
// Главные сеты — строго по плану 5/3/1. Аксессуары — прошлый вес (плана нет).
// BBB — прошлый рабочий вес, а не 50% от TM: расчётный почти всегда ниже
// реального, и его приходилось перебивать руками каждую тренировку.
function initialWeight(s: PlannedSet | undefined): string {
  if (!s) return ''
  if (s.isBBB && s.lastWeight != null) {
    return String(Math.max(s.lastWeight, s.plannedWeight ?? 0))
  }
  return String(s.plannedWeight ?? s.lastWeight ?? '')
}

export function WorkoutClient({ sessionId, plan, weekNumber, dayType, mainTM, historicalBest1RM, initialIdx = 0, initialSavedActuals = {}, startDone = false }: {
  sessionId: string
  plan: PlannedSet[]
  weekNumber: 1 | 2 | 3 | 4
  dayType: string
  mainTM: number
  historicalBest1RM: number | null
  initialIdx?: number
  initialSavedActuals?: Record<number, { weight: number; reps: number }>
  startDone?: boolean
}) {
  const AMRAP_TARGETS: Record<number, string> = {
    1: '5–8 повт',
    2: '3–6 повт',
    3: '3–5 повт',
  }

  const resumeIdx = Math.min(Math.max(initialIdx, 0), Math.max(plan.length - 1, 0))
  const resumeSet = plan[resumeIdx]

  const router = useRouter()
  const [idx, setIdx] = useState(resumeIdx)
  const [weight, setWeight] = useState(initialWeight(resumeSet))
  const [reps, setReps] = useState(String(resumeSet?.plannedReps ?? ''))
  const [saving, setSaving] = useState(false)
  const [phase, setPhase] = useState<'input' | 'rest' | 'done'>(startDone ? 'done' : 'input')
  const [amrapRM, setAmrapRM] = useState<number | null>(null)
  const [restSecs, setRestSecs] = useState(0)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [amrapReps, setAmrapReps] = useState<number | null>(null)
  const [savedActuals, setSavedActuals] = useState<Record<number, { weight: number; reps: number }>>(initialSavedActuals)

  const [tmSuggestion, setTmSuggestion] = useState<number | null>(null)
  const [tmApplied, setTmApplied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const advanceRef = useRef(false)

  const current = plan[idx]
  const nextSet = idx + 1 < plan.length ? plan[idx + 1] : null
  const progress = Math.round((idx / plan.length) * 100)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Все сеты уже в БД, а completed_at ещё null — дожимаем завершение один раз.
  useEffect(() => {
    if (!startDone) return
    let cancelled = false
    ;(async () => {
      try {
        await completeWorkout(sessionId)
      } catch (e) {
        console.error('completeWorkout on resume error:', e)
      }
      if (!cancelled) setPhase('done')
    })()
    return () => { cancelled = true }
  }, [startDone, sessionId])

  useEffect(() => {
    if (phase === 'rest' && restSecs === 0 && advanceRef.current) {
      advanceRef.current = false
      goToNext()
    }
  })

  function goToNext() {
    if (timerRef.current) clearInterval(timerRef.current)
    const nextIdx = idx + 1
    if (nextIdx >= plan.length) { setPhase('done'); return }
    const next = plan[nextIdx]
    setIdx(nextIdx)
    setWeight(initialWeight(next))
    setReps(String(next.plannedReps))
    setAmrapRM(null)
    setPhase('input')
    setConfirmEnd(false)
  }

  function startTimer(seconds: number) {
    advanceRef.current = false
    setRestSecs(seconds)
    setPhase('rest')
    timerRef.current = setInterval(() => {
      setRestSecs(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([300, 100, 300])
          }
          advanceRef.current = true
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleConfirm() {
    setSaving(true)
    const w = parseFloat(weight) || 0
    const r = parseInt(reps) || 0

    try {
      await saveSet({
        sessionId,
        exercise: current.exercise,
        setNumber: current.setNumber,
        plannedReps: current.plannedReps,
        plannedWeightKg: current.plannedWeight,
        actualReps: r,
        actualWeightKg: w,
        isAmrap: current.isAmrap,
      })
    } catch (e) {
      console.error('saveSet error:', e)
      setSaving(false)
      return
    }

    setSavedActuals(prev => ({ ...prev, [idx]: { weight: w, reps: r } }))

    if (current.isAmrap && r > 0) {
      const rm = calcEstimated1RM(w, r)
      setAmrapRM(rm)
      setAmrapReps(r)
      if (weekNumber === 3 && (r < 3 || r > 8)) {
        const suggested = Math.round((rm * 0.9) / 2.5) * 2.5
        if (Math.abs(suggested - mainTM) >= 5) setTmSuggestion(suggested)
      }
    }
    setSaving(false)

    if (idx === plan.length - 1) {
      try { await completeWorkout(sessionId) } catch (e) { console.error('completeWorkout error:', e) }
      setPhase('done')
    } else {
      const next = plan[idx + 1]
      const isSuperset =
        current.supersetGroupId !== null &&
        next.supersetGroupId === current.supersetGroupId &&
        current.supersetRole === 'a' &&
        next.supersetRole === 'b'
      if (isSuperset) {
        goToNext()
      } else {
        startTimer(getRestSeconds(current))
      }
    }
  }

  async function handleSkip() {
    if (idx === plan.length - 1) {
      await completeWorkout(sessionId)
      setPhase('done')
    } else {
      goToNext()
    }
  }

  async function handleEndEarly() {
    if (timerRef.current) clearInterval(timerRef.current)
    try { await completeWorkout(sessionId) } catch (e) { console.error('completeWorkout error:', e) }
    setPhase('done')
  }

  // DONE
  if (phase === 'done') {
    const isPR = amrapRM !== null && historicalBest1RM !== null && amrapRM > historicalBest1RM
    const isFirstPR = amrapRM !== null && historicalBest1RM === null
    const totalVolume = Math.round(
      Object.values(savedActuals).reduce((sum, { weight, reps }) => sum + weight * reps, 0)
    )

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center gap-4">
        <div className="text-6xl">{isPR || isFirstPR ? '🏆' : '💪'}</div>
        <h2 className="text-2xl font-bold">
          {isPR || isFirstPR ? 'Новый рекорд!' : 'Тренировка завершена!'}
        </h2>

        {amrapRM && (
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 w-full max-w-sm">
            <p className="text-green-400 text-sm">Расчётный максимум</p>
            <p className="text-green-300 text-2xl font-bold">~{amrapRM} кг</p>
            {isPR && historicalBest1RM && (
              <p className="text-green-500 text-xs mt-1">Предыдущий: {historicalBest1RM} кг</p>
            )}
          </div>
        )}

        {tmSuggestion && !tmApplied && (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4 w-full max-w-sm text-left">
            <p className="text-yellow-400 text-sm font-semibold">Рекомендация по ТМ</p>
            <p className="text-gray-300 text-sm mt-1">
              {amrapReps && amrapReps > 8
                ? `Вышло ${amrapReps} повт — ТМ занижен.`
                : `Вышло ${amrapReps} повт — ТМ завышен.`}
              {' '}Рекомендую: <span className="text-white font-bold">{tmSuggestion} кг</span> (сейчас {mainTM} кг)
            </p>
            <button
              onClick={async () => {
                await applyTMSuggestion(dayType, tmSuggestion)
                setTmApplied(true)
              }}
              className="mt-3 w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl py-2 text-sm transition-colors">
              Применить {tmSuggestion} кг
            </button>
          </div>
        )}

        {tmApplied && (
          <p className="text-yellow-400 text-sm">ТМ обновлён ✓</p>
        )}

        {totalVolume > 0 && (
          <div className="bg-gray-800 rounded-xl p-4 w-full max-w-sm">
            <p className="text-gray-400 text-sm">Тоннаж</p>
            <p className="text-white text-2xl font-bold">{totalVolume.toLocaleString('ru')} кг</p>
          </div>
        )}

        <button onClick={() => router.push('/today')}
          className="bg-blue-600 text-white font-bold rounded-2xl px-8 py-4 text-lg">
          На главную
        </button>
      </div>
    )
  }

  // REST
  if (phase === 'rest') {
    return (
      <div className="p-4 space-y-4">
        <div className="h-1 bg-gray-800 rounded-full">
          <div className="h-1 bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
        </div>

        {amrapRM && (
          <div className="bg-green-900/30 border border-green-700 rounded-xl p-3 text-center">
            <p className="text-green-400 text-xs">Расчётный максимум</p>
            <p className="text-green-300 text-2xl font-bold">~{amrapRM} кг</p>
          </div>
        )}

        <div className="bg-gray-900 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm mb-2">Отдых</p>
          <p className="text-white font-mono font-bold leading-none" style={{ fontSize: '5rem' }}>
            {formatTime(restSecs)}
          </p>
        </div>

        {nextSet && (
          <div className="bg-gray-800 rounded-2xl p-4">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Следующий</p>
            <p className="text-white font-semibold">{nextSet.exerciseLabel}</p>
            <p className="text-gray-400 text-sm">
              Сет {nextSet.setNumber}
              {nextSet.plannedWeight != null ? ` · ${nextSet.plannedWeight}кг` : ''}
              {' × '}{nextSet.plannedReps}{nextSet.isAmrap ? '+' : ''}
            </p>
          </div>
        )}

        <button onClick={goToNext}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl py-4 text-lg transition-colors">
          Пропустить отдых →
        </button>

        {idx > 0 && (
          <button onClick={() => {
            if (timerRef.current) clearInterval(timerRef.current)
            const prevIdx = idx - 1
            const prev = plan[prevIdx]
            const saved = savedActuals[prevIdx]
            setIdx(prevIdx)
            setWeight(saved ? String(saved.weight) : initialWeight(prev))
            setReps(String(saved?.reps ?? prev.plannedReps))
            setAmrapRM(null)
            setPhase('input')
            setConfirmEnd(false)
          }} className="w-full text-gray-600 py-2 text-sm">
            ← Назад (изменить)
          </button>
        )}

        {!confirmEnd ? (
          <button onClick={() => setConfirmEnd(true)}
            className="w-full py-3 text-sm text-gray-500 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">
            Завершить тренировку раньше
          </button>
        ) : (
          <button onClick={handleEndEarly}
            className="w-full py-3 text-sm text-red-400 bg-red-900/30 hover:bg-red-900/50 rounded-xl transition-colors">
            Точно завершить?
          </button>
        )}
      </div>
    )
  }

  // INPUT
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
          </p>
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-1">Вес (кг)</label>
          <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
            step="2.5" inputMode="decimal"
            className="w-full bg-gray-800 text-white text-2xl font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {(current.isAccessory || current.isBBB) && current.lastWeight != null && (
            <p className="text-gray-500 text-xs mt-1">
              прошлый раз: {current.lastWeight} кг × {current.lastReps ?? '?'} повт.
              {current.lastReps != null && current.lastReps > current.plannedReps && (
                <span className="text-yellow-500 ml-1">→ попробуй добавить вес</span>
              )}
            </p>
          )}
        </div>

        <div>
          <label className="text-gray-400 text-sm block mb-1">
            {current.isAmrap
              ? `Повторения — цель: ${AMRAP_TARGETS[weekNumber] ?? '1–5 повт'}`
              : `Повторения (план: ${current.plannedReps})`}
          </label>
          <input type="number" value={reps} onChange={e => setReps(e.target.value)}
            inputMode="numeric"
            className="w-full bg-gray-800 text-white text-2xl font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {nextSet && (current.isAccessory || current.isBBB) && (
        <div className={`rounded-xl p-3 border ${
          current.supersetGroupId !== null && nextSet.supersetGroupId === current.supersetGroupId
            ? 'bg-blue-900/20 border-blue-700/50'
            : 'bg-gray-800/60 border-gray-700/50'
        }`}>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
            {current.supersetRole === 'a' && nextSet.supersetRole === 'b'
              ? '🔄 Суперсет — сразу после'
              : 'Следующий'}
          </p>
          <p className="text-gray-300 text-sm font-medium">
            {nextSet.exerciseLabel} · Сет {nextSet.setNumber}
          </p>
          <p className="text-gray-500 text-xs">
            × {nextSet.plannedReps}
          </p>
        </div>
      )}

      {idx === plan.length - 1 ? (
        !confirmEnd ? (
          <button onClick={() => setConfirmEnd(true)} disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl py-5 text-xl transition-colors">
            {saving ? 'Сохраняем...' : 'Завершить тренировку'}
          </button>
        ) : (
          <button onClick={handleConfirm} disabled={saving}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-2xl py-5 text-xl transition-colors">
            {saving ? 'Сохраняем...' : 'Точно завершить?'}
          </button>
        )
      ) : (
        <button onClick={handleConfirm} disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl py-5 text-xl transition-colors">
          {saving ? 'Сохраняем...' : 'Сет выполнен →'}
        </button>
      )}

      <div className="flex gap-2">
        <button onClick={handleSkip}
          className="flex-1 py-3 text-sm text-gray-500 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">
          Пропустить сет
        </button>
        {!confirmEnd ? (
          <button onClick={() => setConfirmEnd(true)}
            className="flex-1 py-3 text-sm text-gray-500 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">
            Завершить раньше
          </button>
        ) : (
          <button onClick={handleEndEarly}
            className="flex-1 py-3 text-sm text-red-400 bg-red-900/30 hover:bg-red-900/50 rounded-xl transition-colors">
            Точно завершить?
          </button>
        )}
      </div>

      {idx > 0 && (
        <button onClick={() => {
          const prevIdx = idx - 1
          const prev = plan[prevIdx]
          const saved = savedActuals[prevIdx]
          setIdx(prevIdx)
          setWeight(saved ? String(saved.weight) : initialWeight(prev))
          setReps(String(saved?.reps ?? prev.plannedReps))
          setAmrapRM(null)
        }} className="w-full text-gray-600 py-2 text-sm">
          ← Назад
        </button>
      )}
    </div>
  )
}
