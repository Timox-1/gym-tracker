# Gym Tracker

Мобильный дневник силовых тренировок. Программа **5/3/1 BBB** (Jim Wendler): приложение само считает рабочие веса, подходы и прогрессию по циклам.

Pet-проект под себя — в зале открываю в браузере на телефоне, без App Store.

**Демо:** [gym-tracker-wine-eight.vercel.app](https://gym-tracker-wine-eight.vercel.app) — лучше с телефона, десктоп не адаптирован.

## Что умеет

- Расписание 5/3/1: проценты от training max, целевые повторы по неделям
- Экран тренировки: ввод веса/повторов, подсказка «прошлый раз», кнопка назад
- Таймер отдыха между подходами, автопереход к следующему сету
- Суперсеты: между связанными упражнениями таймер не включается
- AMRAP → расчёт 1RM, экран рекорда, предложение поднять TM на следующий цикл
- Прогресс: графики по лифтам, статистика циклов
- Magic Link авторизация через Supabase

## Стек

Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase · Recharts · Vercel

## Локальный запуск

```bash
git clone https://github.com/Timox-1/gym-tracker.git
cd gym-tracker
npm install
cp .env.example .env.local
# заполни NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

### Supabase

1. Создай проект на [supabase.com](https://supabase.com)
2. Примени миграции из `supabase/migrations/` (SQL Editor или CLI)
3. В Authentication → URL Configuration добавь `http://localhost:3000/auth/callback`
4. Скопируй Project URL и anon key в `.env.local`

### Тесты

```bash
npm test
```

## Структура

| Путь | Назначение |
|------|------------|
| `lib/program/` | Расчёт 5/3/1, расписание, сборка тренировки |
| `components/workout/` | UI экрана тренировки |
| `app/(app)/` | Основные страницы: today, workout, progress, history |
| `supabase/migrations/` | Схема БД + RLS |

## Disclaimer

Данные тренировок хранятся в Supabase автора демо. Для своего инстанса подними свой Supabase и Vercel.