-- Step 285: Add single_glazing, blinds, electric_shutters columns
-- Safe to run multiple times — IF NOT EXISTS guards every statement.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS single_glazing    boolean,
  ADD COLUMN IF NOT EXISTS blinds            boolean,
  ADD COLUMN IF NOT EXISTS electric_shutters boolean;
