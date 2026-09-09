-- A day is however many meals you cook, not four.
--
-- `slot` used to be both the meal's type and its identity, which capped a day at the
-- four enum values and meant a second lunch was unrepresentable. It keeps the type;
-- `slot_index` now carries the identity, so a day is an ordered list of meals whose
-- types may repeat. Named `slot_index` rather than `position` because `position` is a
-- function in Postgres and needs quoting everywhere it appears.
alter table public.meal_plan_items
  add column slot_index smallint;

-- Existing rows are ordered by the canonical run of the day, so nothing moves on screen.
update public.meal_plan_items as item
set slot_index = ranked.rank - 1
from (
  select
    id,
    row_number() over (
      partition by meal_plan_id, day_index
      order by array_position(
        array['breakfast', 'lunch', 'snack', 'dinner']::public.meal_slot[],
        slot
      )
    ) as rank
  from public.meal_plan_items
) as ranked
where ranked.id = item.id;

alter table public.meal_plan_items
  alter column slot_index set not null,
  add constraint meal_plan_items_slot_index_check
    check (slot_index between 0 and 11),
  drop constraint meal_plan_items_meal_plan_id_day_index_slot_key,
  add constraint meal_plan_items_meal_plan_id_day_index_slot_index_key
    unique (meal_plan_id, day_index, slot_index);

-- `enabled_slots` on both tables becomes the shape of a day: the meal types in the
-- order they are cooked, repeating where a day has two lunches. Its length is what
-- "meals per day" means, which is why the separate count is going: it was a second
-- answer to the same question, and it was never read by anything.
alter table public.profiles
  drop column default_meals_per_week;
