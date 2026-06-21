'use client'
import { useState } from 'react'
import { repeatWeek } from '@/app/actions/workout'

export function RepeatWeekButton({ weekNumber, cycleNumber }: {
  weekNumber: number
  cycleNumber: number
}) {
  const [confirm, setConfirm] = useState(false)

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="w-full py-3 text-sm text-gray-500 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
      >
        Повторить неделю {weekNumber}
      </button>
    )
  }

  return (
    <form action={repeatWeek.bind(null, weekNumber, cycleNumber)}>
      <button
        type="submit"
        className="w-full py-3 text-sm text-orange-400 bg-orange-900/30 hover:bg-orange-900/50 rounded-xl transition-colors"
      >
        Сбросить неделю {weekNumber} и начать заново?
      </button>
    </form>
  )
}
