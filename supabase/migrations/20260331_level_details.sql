-- Step 268: Building Information + Level Details columns
-- Adds 4 columns for multi-level property structure.
-- NOTE: already executed manually on 2026-03-31 — this file is for tracking only.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS total_property_area_sqm numeric,
  ADD COLUMN IF NOT EXISTS total_building_floors   integer,
  ADD COLUMN IF NOT EXISTS number_of_levels        integer,
  ADD COLUMN IF NOT EXISTS level_details           jsonb;
