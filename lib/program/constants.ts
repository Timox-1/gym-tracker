export const LIFTS = ['squat', 'bench', 'deadlift'] as const
export type Lift = typeof LIFTS[number]
export type AnyLift = Lift | 'ohp'

export const WEEK_SCHEMES = {
  1: [
    { reps: 5, pct: 0.65, isAmrap: false },
    { reps: 5, pct: 0.75, isAmrap: false },
    { reps: 5, pct: 0.85, isAmrap: true },
  ],
  2: [
    { reps: 3, pct: 0.70, isAmrap: false },
    { reps: 3, pct: 0.80, isAmrap: false },
    { reps: 3, pct: 0.90, isAmrap: true },
  ],
  3: [
    { reps: 5, pct: 0.75, isAmrap: false },
    { reps: 3, pct: 0.85, isAmrap: false },
    { reps: 1, pct: 0.95, isAmrap: true },
  ],
  4: [
    { reps: 5, pct: 0.40, isAmrap: false },
    { reps: 5, pct: 0.50, isAmrap: false },
    { reps: 5, pct: 0.60, isAmrap: false },
  ],
} as const

export const BBB_SETS = 5
export const BBB_REPS = 10
export const BBB_PCT = 0.50

export const BBB_LIFT: Record<Lift, AnyLift> = {
  squat: 'deadlift',
  bench: 'ohp',
  deadlift: 'squat',
}

export const ACCESSORIES: Record<Lift, { name: string; sets: number; reps: number }[]> = {
  squat: [
    { name: 'Подтягивания', sets: 5, reps: 5 },
    { name: 'Дипсы', sets: 3, reps: 10 },
    { name: 'Бицепс', sets: 3, reps: 10 },
    { name: 'Трицепс', sets: 3, reps: 10 },
  ],
  bench: [
    { name: 'Тяга нижнего блока', sets: 4, reps: 10 },
    { name: 'Разводка гантелей', sets: 3, reps: 12 },
    { name: 'Боковые дельты', sets: 3, reps: 15 },
    { name: 'Задние дельты', sets: 3, reps: 15 },
  ],
  deadlift: [
    { name: 'Тяга штанги в наклоне', sets: 4, reps: 8 },
    { name: 'Пресс', sets: 3, reps: 15 },
    { name: 'Curl (бицепс)', sets: 3, reps: 10 },
    { name: 'Трицепс', sets: 3, reps: 10 },
  ],
}

export const LIFT_LABELS: Record<AnyLift, string> = {
  squat: 'Присед',
  bench: 'Жим лёжа',
  deadlift: 'Становая',
  ohp: 'Жим стоя (OHP)',
}
