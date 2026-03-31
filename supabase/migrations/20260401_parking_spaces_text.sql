-- Step 281: Fix parking_spaces column type integer → text
-- Run this only if 20260331_parking_structured.sql was already applied with integer type.
-- Safe to skip if parking_spaces was never created (or already text).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM   information_schema.columns
    WHERE  table_name  = 'properties'
    AND    column_name = 'parking_spaces'
    AND    data_type   = 'integer'
  ) THEN
    ALTER TABLE properties ALTER COLUMN parking_spaces TYPE text USING parking_spaces::text;
    RAISE NOTICE 'OK  parking_spaces converted integer → text';
  ELSE
    RAISE NOTICE 'SKIP parking_spaces is not integer (already text or does not exist)';
  END IF;
END;
$$;
