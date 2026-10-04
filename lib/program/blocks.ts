import type { PlannedSet } from './workout-builder'

export type PlanBlock = {
  id: string
  title: string
  kind: 'main' | 'work'
  start: number
  end: number // exclusive
}

export function planBlocks(plan: PlannedSet[]): PlanBlock[] {
  const blocks: PlanBlock[] = []
  let pos = 0

  while (pos < plan.length) {
    const s = plan[pos]

    if (!s.isBBB && !s.isAccessory) {
      const start = pos
      while (pos < plan.length && !plan[pos].isBBB && !plan[pos].isAccessory) {
        pos++
      }
      blocks.push({
        id: 'main',
        title: plan[start].exerciseLabel,
        kind: 'main',
        start,
        end: pos,
      })
      continue
    }

    if (s.supersetGroupId != null) {
      const groupId = s.supersetGroupId
      const start = pos
      const exercisesInBlock = new Set<string>()

      while (pos < plan.length) {
        const cur = plan[pos]
        if (cur.supersetGroupId === groupId) {
          exercisesInBlock.add(cur.exercise)
          pos++
          continue
        }
        if (cur.supersetGroupId == null && exercisesInBlock.has(cur.exercise)) {
          pos++
          continue
        }
        break
      }

      const labels: string[] = []
      const seen = new Set<string>()
      for (let j = start; j < pos; j++) {
        const label = plan[j].exerciseLabel
        if (!seen.has(label)) {
          seen.add(label)
          labels.push(label)
        }
      }

      blocks.push({
        id: `g${groupId}`,
        title: labels.join(' + '),
        kind: 'work',
        start,
        end: pos,
      })
      continue
    }

    const start = pos
    const exercise = s.exercise
    while (
      pos < plan.length &&
      plan[pos].supersetGroupId == null &&
      plan[pos].exercise === exercise &&
      (plan[pos].isAccessory || plan[pos].isBBB)
    ) {
      pos++
    }

    blocks.push({
      id: `solo-${start}`,
      title: s.exerciseLabel,
      kind: 'work',
      start,
      end: pos,
    })
  }

  return blocks
}
