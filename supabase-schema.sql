-- Run this in your Supabase dashboard: SQL Editor → New query → paste → Run

create table if not exists user_settings (
  id uuid references auth.users primary key,
  avatar text,
  show_3d_coach boolean default true,
  compact_in_workout boolean default true,
  show_during_camera boolean default true,
  show_exercise_demos boolean default true,
  minimal_camera_hud boolean default false,
  countdown_audio_enabled boolean default true,
  talkativeness text default 'normal',
  rep_counting_enabled boolean default true,
  workout_audio_mode text default 'external',
  coach_voice_volume text default 'normal',
  cue_volume text default 'normal',
  duck_external_music boolean default true,
  body_profile jsonb,
  weekly_plan jsonb,
  updated_at timestamptz default now()
);

alter table user_settings add column if not exists countdown_audio_enabled boolean default true;
alter table user_settings add column if not exists workout_audio_mode text default 'external';
alter table user_settings add column if not exists coach_voice_volume text default 'normal';
alter table user_settings add column if not exists cue_volume text default 'normal';
alter table user_settings add column if not exists duck_external_music boolean default true;
alter table user_settings add column if not exists body_profile jsonb;
alter table user_settings add column if not exists weekly_plan jsonb;

create table if not exists workouts (
  id text primary key,
  user_id uuid references auth.users not null,
  completed_at text,
  duration_seconds int,
  goal text,
  level text,
  equipment text,
  total_reps int,
  workout_score int,
  xp_earned int,
  summary jsonb
);

create table if not exists streaks (
  id uuid references auth.users primary key,
  current_streak int default 0,
  longest_streak int default 0,
  workouts_completed int default 0,
  total_minutes int default 0,
  last_workout_date text
);

-- Row Level Security (each user can only read/write their own data)
alter table user_settings enable row level security;
alter table workouts enable row level security;
alter table streaks enable row level security;

create policy "users manage own settings"
  on user_settings for all using (auth.uid() = id);

create policy "users manage own workouts"
  on workouts for all using (auth.uid() = user_id);

create policy "users manage own streaks"
  on streaks for all using (auth.uid() = id);
