import { pickLastExerciseData } from './last-weights'

describe('pickLastExerciseData', () => {
  it('берёт упражнение из более старой сессии, если в свежих его не было', () => {
    const rows = [
      {
        exercise: 'Тяга к лицу',
        actual_weight_kg: 25,
        actual_reps: 15,
        session_id: 'bench-partial',
        set_number: 1,
        completed_at: '2026-07-15T10:00:00Z',
      },
      {
        exercise: 'Армейский жим',
        actual_weight_kg: 25,
        actual_reps: 10,
        session_id: 'bench-full',
        set_number: 1,
        completed_at: '2026-07-08T10:00:00Z',
      },
      {
        exercise: 'Армейский жим',
        actual_weight_kg: 22.5,
        actual_reps: 10,
        session_id: 'bench-full',
        set_number: 2,
        completed_at: '2026-07-08T10:00:00Z',
      },
      {
        exercise: 'Молотки',
        actual_weight_kg: 12.5,
        actual_reps: 10,
        session_id: 'squat-recent',
        set_number: 1,
        completed_at: '2026-08-10T10:00:00Z',
      },
    ]

    const map = pickLastExerciseData(rows, ['Тяга к лицу', 'Армейский жим', 'Жим на наклонной'])

    expect(map['Тяга к лицу']).toEqual({ weight: 25, reps: 15 })
    expect(map['Армейский жим']).toEqual({ weight: 25, reps: 10 })
    expect(map['Жим на наклонной']).toBeUndefined()
  })

  it('для свежей сессии предпочитает её, а не более старую с тем же упражнением', () => {
    const rows = [
      {
        exercise: 'Шраги',
        actual_weight_kg: 40,
        actual_reps: 12,
        session_id: 'new',
        set_number: 1,
        completed_at: '2026-08-12T10:00:00Z',
      },
      {
        exercise: 'Шраги',
        actual_weight_kg: 35,
        actual_reps: 12,
        session_id: 'old',
        set_number: 1,
        completed_at: '2026-07-08T10:00:00Z',
      },
    ]

    expect(pickLastExerciseData(rows, ['Шраги'])['Шраги']).toEqual({ weight: 40, reps: 12 })
  })
})
