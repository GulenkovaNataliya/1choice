-- Step 278: Remove duplex boolean column from properties
-- duplex was a global amenity flag. It has been removed from all admin UI,
-- public display, filters, and AI search. Column is safe to drop.

ALTER TABLE properties DROP COLUMN IF EXISTS duplex;
