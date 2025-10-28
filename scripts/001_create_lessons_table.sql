-- Create lessons table to store user's learning content
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text,
  lesson_type text not null check (lesson_type in ('link', 'word', 'sentence')),
  link_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create review_schedule table to track spaced repetition
create table if not exists public.review_schedule (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  review_date date not null,
  review_interval int not null, -- 0, 1, 3, or 7 days
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.lessons enable row level security;
alter table public.review_schedule enable row level security;

-- RLS Policies for lessons table
create policy "users_select_own_lessons"
  on public.lessons for select
  using (auth.uid() = user_id);

create policy "users_insert_own_lessons"
  on public.lessons for insert
  with check (auth.uid() = user_id);

create policy "users_update_own_lessons"
  on public.lessons for update
  using (auth.uid() = user_id);

create policy "users_delete_own_lessons"
  on public.lessons for delete
  using (auth.uid() = user_id);

-- RLS Policies for review_schedule table
create policy "users_select_own_reviews"
  on public.review_schedule for select
  using (auth.uid() = user_id);

create policy "users_insert_own_reviews"
  on public.review_schedule for insert
  with check (auth.uid() = user_id);

create policy "users_update_own_reviews"
  on public.review_schedule for update
  using (auth.uid() = user_id);

create policy "users_delete_own_reviews"
  on public.review_schedule for delete
  using (auth.uid() = user_id);

-- Create indexes for better query performance
create index if not exists idx_lessons_user_id on public.lessons(user_id);
create index if not exists idx_review_schedule_user_id on public.review_schedule(user_id);
create index if not exists idx_review_schedule_review_date on public.review_schedule(review_date);
create index if not exists idx_review_schedule_lesson_id on public.review_schedule(lesson_id);
