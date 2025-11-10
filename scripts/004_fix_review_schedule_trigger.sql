-- Fix review schedule trigger to use lesson_date instead of current_date
-- This allows lessons added with past dates to have review schedules start from those dates

create or replace function public.create_review_schedule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create review entries for 0, 1, 3, and 7 days relative to the lesson_date
  insert into public.review_schedule (lesson_id, user_id, review_date, review_interval)
  values
    (new.id, new.user_id, cast(new.lesson_date as date), 0),
    (new.id, new.user_id, cast(new.lesson_date as date) + interval '1 day', 1),
    (new.id, new.user_id, cast(new.lesson_date as date) + interval '3 days', 3),
    (new.id, new.user_id, cast(new.lesson_date as date) + interval '7 days', 7);

  return new;
end;
$$;
