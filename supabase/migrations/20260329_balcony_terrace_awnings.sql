-- step 262.38: add balcony / terrace / awnings boolean columns
-- Idempotent: safe to run multiple times

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS balcony boolean,
  ADD COLUMN IF NOT EXISTS terrace boolean,
  ADD COLUMN IF NOT EXISTS awnings boolean;
