-- Step 284: Add exposure column for property position / exposure chips
-- exposure text[] — multi-select: corner, interior, dual_aspect, frontage

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS exposure text[];
