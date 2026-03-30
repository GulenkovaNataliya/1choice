-- Step 267: Final amenities restructure
-- `terrace` is renamed to `veranda` (preserves existing data).
-- `storage` was already renamed to `wardrobe_room` manually before this migration.
-- 11 new boolean amenity columns are added.

ALTER TABLE properties
  RENAME COLUMN terrace TO veranda;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS jacuzzi              boolean,
  ADD COLUMN IF NOT EXISTS close_to_beaches     boolean,
  ADD COLUMN IF NOT EXISTS panoramic_view       boolean,
  ADD COLUMN IF NOT EXISTS acropolis_view       boolean,
  ADD COLUMN IF NOT EXISTS duplex               boolean,
  ADD COLUMN IF NOT EXISTS private_roof_terrace boolean,
  ADD COLUMN IF NOT EXISTS loft                 boolean,
  ADD COLUMN IF NOT EXISTS internal_staircase   boolean,
  ADD COLUMN IF NOT EXISTS barbeque             boolean,
  ADD COLUMN IF NOT EXISTS home_cinema          boolean,
  ADD COLUMN IF NOT EXISTS smoke_detection      boolean;
