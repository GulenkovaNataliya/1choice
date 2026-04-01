-- Step 293: Add electricity field
-- Safe to run multiple times — IF NOT EXISTS guards the statement.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS electricity text[];
