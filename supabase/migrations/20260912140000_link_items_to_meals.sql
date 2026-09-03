-- Approving a meal puts its ingredients on the list, so un-approving has to be able
-- to take exactly those rows back off again. meal_plan_id only says which week an
-- item came from, which is not precise enough to undo one meal.
alter table public.shopping_items
add column meal_plan_item_id uuid references public.meal_plan_items (id) on delete set null;

create index shopping_items_meal_plan_item_idx
on public.shopping_items (meal_plan_item_id)
where meal_plan_item_id is not null;
