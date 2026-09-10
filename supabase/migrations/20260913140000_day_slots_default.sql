-- The column this replaced had a default, and dropping it turned every plain insert
-- into an error. A week that nobody has shaped is seven ordinary days.
alter table public.meal_plans
  alter column day_slots set default jsonb_build_array(
    '["breakfast","lunch","snack","dinner"]'::jsonb,
    '["breakfast","lunch","snack","dinner"]'::jsonb,
    '["breakfast","lunch","snack","dinner"]'::jsonb,
    '["breakfast","lunch","snack","dinner"]'::jsonb,
    '["breakfast","lunch","snack","dinner"]'::jsonb,
    '["breakfast","lunch","snack","dinner"]'::jsonb,
    '["breakfast","lunch","snack","dinner"]'::jsonb
  );
