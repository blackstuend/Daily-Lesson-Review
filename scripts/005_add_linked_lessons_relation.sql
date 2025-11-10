alter table public.lessons
  add column if not exists linked_lesson_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lessons_linked_lesson_id_fkey'
  ) then
    alter table public.lessons
      add constraint lessons_linked_lesson_id_fkey
      foreign key (linked_lesson_id)
      references public.lessons(id)
      on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'lessons_linked_type_check'
  ) then
    alter table public.lessons
      add constraint lessons_linked_type_check
      check (
        linked_lesson_id is null
        or lesson_type in ('word', 'sentence')
      );
  end if;
end $$;

create index if not exists lessons_linked_lesson_id_idx on public.lessons (linked_lesson_id);
