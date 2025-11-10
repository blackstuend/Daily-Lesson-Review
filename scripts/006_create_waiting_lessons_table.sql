-- Create table to store lessons that are in the pre-study waiting list
create table if not exists public.waiting_lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text,
  lesson_type text not null check (lesson_type in ('link', 'word', 'sentence')),
  link_url text,
  planned_start_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.waiting_lessons enable row level security;

do $$
begin
  if not exists (select 1 from pg_policy where polname = 'waiting_lessons_select_own') then
    create policy "waiting_lessons_select_own"
      on public.waiting_lessons for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policy where polname = 'waiting_lessons_insert_own') then
    create policy "waiting_lessons_insert_own"
      on public.waiting_lessons for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policy where polname = 'waiting_lessons_update_own') then
    create policy "waiting_lessons_update_own"
      on public.waiting_lessons for update
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policy where polname = 'waiting_lessons_delete_own') then
    create policy "waiting_lessons_delete_own"
      on public.waiting_lessons for delete
      using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists waiting_lessons_user_id_idx on public.waiting_lessons(user_id);
create index if not exists waiting_lessons_created_at_idx on public.waiting_lessons(created_at desc);

-- Helper function to atomically move a waiting lesson into the regular lessons table
create or replace function public.promote_waiting_lesson(
  p_waiting_lesson_id uuid,
  p_lesson_date date default current_date
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  wait_lesson public.waiting_lessons%rowtype;
  new_lesson_id uuid;
begin
  select * into wait_lesson
  from public.waiting_lessons
  where id = p_waiting_lesson_id;

  if not found then
    raise exception 'Waiting lesson not found';
  end if;

  if wait_lesson.user_id <> auth.uid() then
    raise exception 'Not authorized to promote this lesson';
  end if;

  insert into public.lessons (
    user_id,
    title,
    content,
    lesson_type,
    link_url,
    lesson_date,
    created_at,
    updated_at
  ) values (
    wait_lesson.user_id,
    wait_lesson.title,
    wait_lesson.content,
    wait_lesson.lesson_type,
    wait_lesson.link_url,
    coalesce(p_lesson_date::timestamptz, now()),
    now(),
    now()
  )
  returning id into new_lesson_id;

  delete from public.waiting_lessons where id = p_waiting_lesson_id;

  return new_lesson_id;
end;
$$;

grant execute on function public.promote_waiting_lesson(uuid, date) to authenticated;
