import { getNextWorkout } from './schedule'

describe('getNextWorkout', () => {
  it('first workout: squat week1 cycle1', () => {
    expect(getNextWorkout(null)).toEqual({ dayType: 'squat', weekNumber: 1, cycleNumber: 1 })
  })
  it('squat → bench, same week and cycle', () => {
    expect(getNextWorkout({ dayType: 'squat', weekNumber: 1, cycleNumber: 1 }))
      .toEqual({ dayType: 'bench', weekNumber: 1, cycleNumber: 1 })
  })
  it('bench → deadlift, same week', () => {
    expect(getNextWorkout({ dayType: 'bench', weekNumber: 2, cycleNumber: 1 }))
      .toEqual({ dayType: 'deadlift', weekNumber: 2, cycleNumber: 1 })
  })
  it('deadlift → squat, advances week', () => {
    expect(getNextWorkout({ dayType: 'deadlift', weekNumber: 1, cycleNumber: 1 }))
      .toEqual({ dayType: 'squat', weekNumber: 2, cycleNumber: 1 })
  })
  it('week4 deadlift → new cycle week1', () => {
    expect(getNextWorkout({ dayType: 'deadlift', weekNumber: 4, cycleNumber: 1 }))
      .toEqual({ dayType: 'squat', weekNumber: 1, cycleNumber: 2 })
  })
})
