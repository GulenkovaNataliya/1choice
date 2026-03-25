-- Migration: ensure all columns required by /api/leads exist on the leads table
-- Step 262.20 — 2026-03-25
--
-- Root cause of "Failed to save lead": the leads table was created via the Supabase
-- Dashboard before the chat feature was built. Several columns inserted by the
-- /api/leads route may not exist in the live DB yet.
--
-- ALL statements use ADD COLUMN IF NOT EXISTS — completely safe to run on a table
-- that already has some or all of these columns.  Idempotent.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type         text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source            text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS page_url          text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_id       uuid;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_title    text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_code     text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_slug     text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS property_location text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS summary           text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS full_chat         text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status            text DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS internal_note     text;
