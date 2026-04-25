create table training_maxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  lift text not null check (lift in ('squat', 'bench', 'deadlift', 'ohp')),
  value_kg numeric not null,
  updated_at timestamptz default now(),
  unique(user_id, lift)
);
alter table training_maxes enable row level security;
create policy "own tms" on training_maxes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null default current_date,
  day_type text not null check (day_type in ('squat', 'bench', 'deadlift')),
  week_number int not null check (week_number between 1 and 4),
  cycle_number int not null default 1,
  notes text,
  completed_at timestamptz
);
alter table workout_sessions enable row level security;
create policy "own sessions" on workout_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references workout_sessions on delete cascade not null,
  exercise text not null,
  set_number int not null,
  planned_reps int,
  planned_weight_kg numeric,
  actual_reps int,
  actual_weight_kg numeric,
  is_amrap boolean default false,
  estimated_1rm numeric,
  created_at timestamptz default now()
);
alter table sets enable row level security;
create policy "own sets" on sets for all
  using (exists (
    select 1 from workout_sessions
    where workout_sessions.id = sets.session_id
    and workout_sessions.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from workout_sessions
    where workout_sessions.id = sets.session_id
    and workout_sessions.user_id = auth.uid()
  ));
