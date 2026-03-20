-- Migration: harden site_settings RLS policies
-- Step 250 — 2026-03-20
--
-- Replace over-broad FOR ALL write policy with explicit UPDATE + INSERT only.
-- DELETE policy is intentionally omitted — the singleton row must not be
-- deletable through the API by any authenticated user.

-- Drop the old broad policy
DROP POLICY IF EXISTS "site_settings_write" ON site_settings;

-- INSERT: allows authenticated users to re-seed the row if it was somehow deleted
CREATE POLICY "site_settings_insert" ON site_settings
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: allows authenticated users to update the singleton row
CREATE POLICY "site_settings_update" ON site_settings
  FOR UPDATE
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- No DELETE policy → authenticated users cannot delete the singleton row via API.
