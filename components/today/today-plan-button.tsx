'use client'

import { useState } from 'react'
import { PlanSheet } from '@/components/workout/plan-sheet'
import type { PlannedSet } from '@/lib/program/workout-builder'

export function TodayPlanButton({ plan }: { plan: PlannedSet[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
      >
        Весь план
      </button>
      {open && (
        <PlanSheet
          plan={plan}
          saved={{}}
          currentIdx={-1}
          canJump={false}
          onClose={() => setOpen(false)}
          onJump={() => {}}
        />
      )}
    </>
  )
}
