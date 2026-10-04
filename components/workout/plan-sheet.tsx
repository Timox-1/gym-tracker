'use client'

import { planBlocks, type PlanBlock } from '@/lib/program/blocks'
import { suggestedWeight } from '@/lib/program/set-weight'
import type { PlannedSet } from '@/lib/program/workout-builder'

export function PlanSheet({
  plan,
  saved,
  currentIdx,
  canJump,
  onClose,
  onJump,
}: {
  plan: PlannedSet[]
  saved: Record<number, unknown>
  currentIdx: number
  canJump: boolean
  onClose: () => void
  onJump: (block: PlanBlock) => void
}) {
  const blocks = planBlocks(plan)

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={onClose}>
      <div
        className="bg-gray-950 w-full max-h-[85vh] overflow-y-auto rounded-t-3xl p-4 pb-8 space-y-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Весь план</h2>
          <button onClick={onClose} className="text-gray-400 px-2 py-1">Закрыть</button>
        </div>
        {!canJump && currentIdx >= 0 && (
          <p className="text-gray-500 text-xs">Другой порядок — после трёх подходов базы.</p>
        )}

        {blocks.map(block => {
          const indexes = []
          for (let i = block.start; i < block.end; i++) indexes.push(i)
          const unfinished = indexes.filter(i => saved[i] == null)
          const here = currentIdx >= block.start && currentIdx < block.end
          const showJump = canJump && block.kind === 'work' && unfinished.length > 0 && !here

          return (
            <div key={block.id} className="bg-gray-900 rounded-2xl p-3 space-y-1">
              <p className="text-white font-semibold text-sm">{block.title}</p>
              {indexes.map(i => {
                const s = plan[i]
                const kg = suggestedWeight(s)
                const done = saved[i] != null
                return (
                  <div key={i} className="flex justify-between text-sm gap-2">
                    <span className={done ? 'text-gray-600' : 'text-gray-300'}>
                      {done ? '✓ ' : ''}{s.exerciseLabel} · {s.setNumber}
                    </span>
                    <span className={done ? 'text-gray-600' : 'text-gray-200'}>
                      {kg != null ? `${kg} кг × ` : '× '}{s.plannedReps}{s.isAmrap ? '+' : ''}
                    </span>
                  </div>
                )
              })}
              {showJump && (
                <button
                  onClick={() => onJump(block)}
                  className="mt-2 w-full py-2 text-sm text-blue-300 bg-blue-900/30 rounded-xl"
                >
                  Делать сейчас
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
