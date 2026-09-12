-- A planned meal is a reference to a recipe, not a claim on it. Restricting the
-- delete made the library hostage to the planner: a recipe could not be thrown away
-- until every week that had ever used it was unpicked by hand, and the refusal was
-- the only thing standing between a cook and a tidy library.
--
-- Cascading is the honest rule. An empty slot has always been stored as the absence
-- of a row, so removing the row is exactly "that meal is no longer planned" — the
-- slot goes back to offering to fill it.
alter table public.meal_plan_items
  drop constraint meal_plan_items_recipe_id_fkey;

alter table public.meal_plan_items
  add constraint meal_plan_items_recipe_id_fkey
    foreign key (recipe_id) references public.recipes (id) on delete cascade;
