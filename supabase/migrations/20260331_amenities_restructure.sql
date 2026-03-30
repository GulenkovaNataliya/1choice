-- Step 267: Final amenities restructure
-- Adds 12 new boolean amenity columns.
-- `storage` stays as-is (UI label becomes "Wardrobe Room" in code only).
-- `terrace` column is kept for historical data; new `veranda` is the active field.

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS jacuzzi            boolean,
  ADD COLUMN IF NOT EXISTS close_to_beaches   boolean,
  ADD COLUMN IF NOT EXISTS panoramic_view     boolean,
  ADD COLUMN IF NOT EXISTS acropolis_view     boolean,
  ADD COLUMN IF NOT EXISTS duplex             boolean,
  ADD COLUMN IF NOT EXISTS veranda            boolean,
  ADD COLUMN IF NOT EXISTS private_roof_terrace boolean,
  ADD COLUMN IF NOT EXISTS loft               boolean,
  ADD COLUMN IF NOT EXISTS internal_staircase boolean,
  ADD COLUMN IF NOT EXISTS barbeque           boolean,
  ADD COLUMN IF NOT EXISTS home_cinema        boolean,
  ADD COLUMN IF NOT EXISTS smoke_detection    boolean;
