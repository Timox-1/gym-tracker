import { LIFTS, type Lift } from './constants'

type LastSession = { dayType: string; weekNumber: number; cycleNumber: number } | null

export function getNextWorkout(last: LastSession) {
  if (!last) return { dayType: 'squat' as Lift, weekNumber: 1 as const, cycleNumber: 1 }

  const currentIndex = LIFTS.indexOf(last.dayType as Lift)
  const nextIndex = (currentIndex + 1) % LIFTS.length
  const wrapped = nextIndex === 0

  let weekNumber = last.weekNumber
  let cycleNumber = last.cycleNumber

  if (wrapped) {
    weekNumber += 1
    if (weekNumber > 4) { weekNumber = 1; cycleNumber += 1 }
  }

  return {
    dayType: LIFTS[nextIndex],
    weekNumber: weekNumber as 1 | 2 | 3 | 4,
    cycleNumber,
  }
}
