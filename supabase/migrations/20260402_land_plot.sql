-- Step 289: Add Land / Plot fields
-- Safe to run multiple times — IF NOT EXISTS guards every statement.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS land_area_sqm                numeric,
  ADD COLUMN IF NOT EXISTS building_coefficient         numeric,
  ADD COLUMN IF NOT EXISTS coverage_ratio               numeric,
  ADD COLUMN IF NOT EXISTS frontage_m                   numeric,
  ADD COLUMN IF NOT EXISTS remaining_buildable_area_sqm numeric,
  ADD COLUMN IF NOT EXISTS town_planning_status         text,
  ADD COLUMN IF NOT EXISTS land_slope                   text,
  ADD COLUMN IF NOT EXISTS land_features                text[];
