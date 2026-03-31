-- Step 275: Heating & Cooling restructure — Greek real-estate model
-- Adds 4 new structured columns. Old columns (heating_type, cooling_type,
-- custom_heating, custom_cooling) are kept for backward compatibility.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS heating_system   text,
  ADD COLUMN IF NOT EXISTS heating_fuel     text,
  ADD COLUMN IF NOT EXISTS heating_features text[],
  ADD COLUMN IF NOT EXISTS cooling_system   text;
