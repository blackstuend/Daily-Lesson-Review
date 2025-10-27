-- Function to automatically create review schedule entries when a lesson is added
create or replace function public.create_review_schedule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create review entries for 0, 1, 3, and 7 days
  insert into public.review_schedule (lesson_id, user_id, review_date, review_interval)
  values
    (new.id, new.user_id, current_date, 0),
    (new.id, new.user_id, current_date + interval '1 day', 1),
    (new.id, new.user_id, current_date + interval '3 days', 3),
    (new.id, new.user_id, current_date + interval '7 days', 7);
  
  return new;
end;
$$;

-- Create trigger to automatically generate review schedule
drop trigger if exists on_lesson_created on public.lessons;

create trigger on_lesson_created
  after insert on public.lessons
  for each row
  execute function public.create_review_schedule();
