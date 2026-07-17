'use client'
import { useState } from 'react'
import { startWorkout, skipWorkout, skipWeek } from '@/app/actions/workout'

export function TodayActions({ dayType, weekNumber, cycleNumber }: {
  dayType: string
  weekNumber: number
  cycleNumber: number
}) {
  const [confirmSkip, setConfirmSkip] = useState(false)
  const [confirmSkipWeek, setConfirmSkipWeek] = useState(false)
  const isDeload = weekNumber === 4

  return (
    <div className="space-y-2">
      <form action={startWorkout.bind(null, dayType, weekNumber, cycleNumber)}>
        <button type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl py-5 text-xl transition-colors">
          Начать тренировку
        </button>
      </form>

      {!confirmSkip ? (
        <button onClick={() => setConfirmSkip(true)}
          className="w-full py-3 text-sm text-gray-500 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">
          Пропустить эту тренировку
        </button>
      ) : (
        <form action={skipWorkout.bind(null, dayType, weekNumber, cycleNumber)}>
          <button type="submit"
            className="w-full py-3 text-sm text-yellow-400 bg-yellow-900/30 hover:bg-yellow-900/50 rounded-xl transition-colors">
            Точно пропустить?
          </button>
        </form>
      )}

      {/* Только на делоаде: пропуск рабочей недели — не та привычка,
          которую стоит поощрять кнопкой в один тап. */}
      {isDeload && (
        !confirmSkipWeek ? (
          <button onClick={() => setConfirmSkipWeek(true)}
            className="w-full py-3 text-sm text-gray-500 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors">
            Пропустить всю разгрузку → цикл {cycleNumber + 1}
          </button>
        ) : (
          <form action={skipWeek.bind(null, weekNumber, cycleNumber)}>
            <button type="submit"
              className="w-full py-3 text-sm text-yellow-400 bg-yellow-900/30 hover:bg-yellow-900/50 rounded-xl transition-colors">
              Точно пропустить неделю целиком?
            </button>
          </form>
        )
      )}
    </div>
  )
}
