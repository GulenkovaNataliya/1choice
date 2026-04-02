-- Migration: add entry_intent column to leads table
-- Step 315 — 2026-04-02
--
-- Root cause of "Failed to save lead":
-- /api/leads route inserts `entry_intent` (the user's first chat intent, captured
-- before the lead form opens) but the column was never added to the DB.
-- The missing column causes every INSERT to fail with a Supabase error,
-- which the route catches and returns as "Failed to save lead" (500).
--
-- IF NOT EXISTS — safe to run on any state of the table.

ALTER TABLE leads ADD COLUMN IF NOT EXISTS entry_intent text;
