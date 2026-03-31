-- Step 277/281: Parking structured block
-- Adds 6 new columns. Legacy parking boolean column is preserved unchanged.
-- parking_spaces is text (not integer) — supports values like "1", "2", "1+1"

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS parking_spaces      text,
  ADD COLUMN IF NOT EXISTS parking_type        text,
  ADD COLUMN IF NOT EXISTS parking_level       text,
  ADD COLUMN IF NOT EXISTS parking_area_sqm    numeric,
  ADD COLUMN IF NOT EXISTS parking_suitable_for text[],
  ADD COLUMN IF NOT EXISTS parking_features    text[];
