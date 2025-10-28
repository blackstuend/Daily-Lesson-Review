-- Add a dedicated lesson_date column so users can choose the day a lesson is associated with
alter table public.lessons
  add column if not exists lesson_date timestamptz not null default now();

-- Backfill the lesson_date for existing lessons to match their original creation time
update public.lessons
  set lesson_date = created_at
  where lesson_date is distinct from created_at;
