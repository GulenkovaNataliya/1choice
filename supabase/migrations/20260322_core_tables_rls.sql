-- Migration: RLS policies for core tables — properties, leads, locations
-- Step 259.6 — 2026-03-22
--
-- SAFE TO RUN MULTIPLE TIMES: every block is wrapped in DO $$ / IF NOT EXISTS
-- to skip creation if the policy already exists under the same name.
--
-- No existing policies are dropped — this migration only adds missing ones.
-- If you find that Supabase already has policies on these tables (via Dashboard),
-- run the IF NOT EXISTS checks — they will skip cleanly without conflict.
--
-- =============================================================================
-- DESIGN SUMMARY
-- =============================================================================
--
-- properties:
--   SELECT  public (anon) — filtered to published + public rows only
--   INSERT  authenticated — admin only
--   UPDATE  authenticated — admin only
--   DELETE  authenticated — admin only
--
-- leads:
--   SELECT  authenticated — admin only (PII: name, WhatsApp, email, chat)
--   INSERT  public (anon) — contact forms and chat widget submit from browser
--   UPDATE  authenticated — admin only
--   DELETE  authenticated — admin only
--
-- locations:
--   SELECT  public (anon) — reference/lookup data, no sensitive columns
--   INSERT  authenticated — admin only
--   UPDATE  authenticated — admin only
--   DELETE  authenticated — admin only
--
-- =============================================================================


-- =============================================================================
-- A. properties
-- =============================================================================

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- SELECT: public visitors see only published, public-facing, non-private listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'properties' AND policyname = 'prop_select_public'
  ) THEN
    CREATE POLICY "prop_select_public" ON properties
      FOR SELECT
      USING (
        status             = 'published'
        AND publish_1choice = true
        AND (private_collection IS NULL OR private_collection = false)
      );
    RAISE NOTICE 'OK  [A] prop_select_public created on properties';
  ELSE
    RAISE NOTICE 'SKIP[A] prop_select_public already exists on properties';
  END IF;
END;
$$;

-- INSERT: authenticated admin users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'properties' AND policyname = 'prop_insert_authenticated'
  ) THEN
    CREATE POLICY "prop_insert_authenticated" ON properties
      FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
    RAISE NOTICE 'OK  [A] prop_insert_authenticated created on properties';
  ELSE
    RAISE NOTICE 'SKIP[A] prop_insert_authenticated already exists on properties';
  END IF;
END;
$$;

-- UPDATE: authenticated admin users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'properties' AND policyname = 'prop_update_authenticated'
  ) THEN
    CREATE POLICY "prop_update_authenticated" ON properties
      FOR UPDATE
      USING     (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
    RAISE NOTICE 'OK  [A] prop_update_authenticated created on properties';
  ELSE
    RAISE NOTICE 'SKIP[A] prop_update_authenticated already exists on properties';
  END IF;
END;
$$;

-- DELETE: authenticated admin users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'properties' AND policyname = 'prop_delete_authenticated'
  ) THEN
    CREATE POLICY "prop_delete_authenticated" ON properties
      FOR DELETE
      USING (auth.role() = 'authenticated');
    RAISE NOTICE 'OK  [A] prop_delete_authenticated created on properties';
  ELSE
    RAISE NOTICE 'SKIP[A] prop_delete_authenticated already exists on properties';
  END IF;
END;
$$;


-- =============================================================================
-- B. leads
-- =============================================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated admin users only — leads contain PII (name, WhatsApp, email, chat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'leads_select_authenticated'
  ) THEN
    CREATE POLICY "leads_select_authenticated" ON leads
      FOR SELECT
      USING (auth.role() = 'authenticated');
    RAISE NOTICE 'OK  [B] leads_select_authenticated created on leads';
  ELSE
    RAISE NOTICE 'SKIP[B] leads_select_authenticated already exists on leads';
  END IF;
END;
$$;

-- INSERT: public (anon) — contact forms and chat widget submit leads from the browser
-- The anon key is exposed client-side (NEXT_PUBLIC_SUPABASE_ANON_KEY),
-- so this policy must be open for form submissions to work without auth.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'leads_insert_public'
  ) THEN
    CREATE POLICY "leads_insert_public" ON leads
      FOR INSERT
      WITH CHECK (true);
    RAISE NOTICE 'OK  [B] leads_insert_public created on leads';
  ELSE
    RAISE NOTICE 'SKIP[B] leads_insert_public already exists on leads';
  END IF;
END;
$$;

-- UPDATE: authenticated admin users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'leads_update_authenticated'
  ) THEN
    CREATE POLICY "leads_update_authenticated" ON leads
      FOR UPDATE
      USING     (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
    RAISE NOTICE 'OK  [B] leads_update_authenticated created on leads';
  ELSE
    RAISE NOTICE 'SKIP[B] leads_update_authenticated already exists on leads';
  END IF;
END;
$$;

-- DELETE: authenticated admin users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'leads_delete_authenticated'
  ) THEN
    CREATE POLICY "leads_delete_authenticated" ON leads
      FOR DELETE
      USING (auth.role() = 'authenticated');
    RAISE NOTICE 'OK  [B] leads_delete_authenticated created on leads';
  ELSE
    RAISE NOTICE 'SKIP[B] leads_delete_authenticated already exists on leads';
  END IF;
END;
$$;


-- =============================================================================
-- C. locations
-- =============================================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- SELECT: public (anon) — lookup/reference data only, no sensitive columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'locations' AND policyname = 'loc_select_public'
  ) THEN
    CREATE POLICY "loc_select_public" ON locations
      FOR SELECT
      USING (true);
    RAISE NOTICE 'OK  [C] loc_select_public created on locations';
  ELSE
    RAISE NOTICE 'SKIP[C] loc_select_public already exists on locations';
  END IF;
END;
$$;

-- INSERT: authenticated admin users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'locations' AND policyname = 'loc_insert_authenticated'
  ) THEN
    CREATE POLICY "loc_insert_authenticated" ON locations
      FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
    RAISE NOTICE 'OK  [C] loc_insert_authenticated created on locations';
  ELSE
    RAISE NOTICE 'SKIP[C] loc_insert_authenticated already exists on locations';
  END IF;
END;
$$;

-- UPDATE: authenticated admin users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'locations' AND policyname = 'loc_update_authenticated'
  ) THEN
    CREATE POLICY "loc_update_authenticated" ON locations
      FOR UPDATE
      USING     (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
    RAISE NOTICE 'OK  [C] loc_update_authenticated created on locations';
  ELSE
    RAISE NOTICE 'SKIP[C] loc_update_authenticated already exists on locations';
  END IF;
END;
$$;

-- DELETE: authenticated admin users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'locations' AND policyname = 'loc_delete_authenticated'
  ) THEN
    CREATE POLICY "loc_delete_authenticated" ON locations
      FOR DELETE
      USING (auth.role() = 'authenticated');
    RAISE NOTICE 'OK  [C] loc_delete_authenticated created on locations';
  ELSE
    RAISE NOTICE 'SKIP[C] loc_delete_authenticated already exists on locations';
  END IF;
END;
$$;
