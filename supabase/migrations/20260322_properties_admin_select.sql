-- Migration: add admin SELECT policy on properties
-- Step 261.2 — 2026-03-22
--
-- Problem: prop_select_public (step 259.6) filters rows to:
--   status='published' AND publish_1choice=true AND private_collection IS NOT TRUE
--
-- This also restricts authenticated admin sessions — they can no longer see
-- draft, archived, publish_1choice=false, or private_collection=true properties.
--
-- Fix: add a second SELECT policy for authenticated users with no row filter.
-- Postgres RLS ORs multiple SELECT policies — an authenticated admin matches
-- this policy and sees all rows; an anon visitor only matches prop_select_public.
--
-- Auth model note: only admin users have Supabase Auth accounts in this project.
-- Public visitors are always anon. Therefore auth.role()='authenticated' == admin.
-- ADMIN_EMAILS / middleware serve as the application-level gate; this is the
-- DB-level gate.
--
-- No existing policies are dropped or modified.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'properties' AND policyname = 'prop_select_admin'
  ) THEN
    CREATE POLICY "prop_select_admin" ON properties
      FOR SELECT
      USING (auth.role() = 'authenticated');
    RAISE NOTICE 'OK  prop_select_admin created on properties';
  ELSE
    RAISE NOTICE 'SKIP prop_select_admin already exists on properties';
  END IF;
END;
$$;
