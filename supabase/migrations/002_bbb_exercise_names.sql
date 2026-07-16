-- BBB-упражнения: единое имя с суффиксом _bbb
--
-- Проблема: BBB-присед на дне становой писался как exercise='squat' — тем же
-- именем, что рабочий присед на дне приседа. Из-за этого lastDataMap в
-- app/(app)/workout/[id]/page.tsx подтягивал вес рабочего приседа (до 92.5 кг)
-- в качестве «прошлый раз» для BBB-приседа (реально ~50 кг).
-- Румынка писалась как 'rdl' — коллизии нет, но для единообразия тоже _bbb.
--
-- Границы данных проверены перед миграцией:
--   day_type=deadlift, exercise='squat' → 35 сетов, все planned_reps=10, is_amrap=false → все BBB
--   day_type=squat,    exercise='squat' → 33 сета, planned_reps 1–5, есть AMRAP → рабочие, НЕ трогаем
--   exercise='rdl'                      → 51 сет, только дни приседа, все planned_reps=10 → все BBB

begin;

-- Румынская тяга: 'rdl' → 'rdl_bbb' (используется только как BBB)
update public.sets
set exercise = 'rdl_bbb'
where exercise = 'rdl';

-- BBB-присед на дне становой: 'squat' → 'squat_bbb'.
-- Отбор по day_type='deadlift' — рабочий лифт там 'deadlift',
-- поэтому любой 'squat' в такой сессии заведомо BBB.
update public.sets st
set exercise = 'squat_bbb'
from public.workout_sessions s
where st.session_id = s.id
  and s.day_type = 'deadlift'
  and st.exercise = 'squat';

commit;
