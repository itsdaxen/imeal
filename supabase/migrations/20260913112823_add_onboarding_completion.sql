alter table public.profiles
  add column onboarding_completed_at timestamptz;

-- Onboarding is a first-run experience. Accounts that already used the product have
-- made these choices in Profile and must not be sent through setup retroactively.
update public.profiles
set onboarding_completed_at = coalesce(updated_at, created_at, now());
