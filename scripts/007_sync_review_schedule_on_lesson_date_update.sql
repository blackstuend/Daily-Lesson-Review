-- Keep spaced repetition entries aligned when a lesson's date changes
create or replace function public.sync_review_schedule_with_lesson_date()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_base_date date := cast(new.lesson_date as date);
  old_base_date date := cast(old.lesson_date as date);
begin
  if new_base_date is distinct from old_base_date then
    update public.review_schedule
    set review_date = (new_base_date + interval '1 day' * review_interval)::date
    where lesson_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_lesson_date_updated on public.lessons;

create trigger on_lesson_date_updated
  after update of lesson_date on public.lessons
  for each row
  when (cast(new.lesson_date as date) is distinct from cast(old.lesson_date as date))
  execute function public.sync_review_schedule_with_lesson_date();
