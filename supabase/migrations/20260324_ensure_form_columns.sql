-- Migration: ensure all PropertyForm columns exist on properties table
-- Step 262.3 — 2026-03-24
--
-- SAFE TO RUN MULTIPLE TIMES — every ALTER uses IF NOT EXISTS.
--
-- Purpose: single idempotent file that guarantees the DB matches the
-- current buildPayload() field list in PropertyForm.tsx.
-- Run this if property create/save returns HTTP 400 from Supabase.
--
-- Covers columns added in steps 251–261 that may not have been applied
-- to the live instance yet.

-- ── custom_badge, custom_badge_color (step 251) ──────────────────────────────
ALTER TABLE properties ADD COLUMN IF NOT EXISTS custom_badge       text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS custom_badge_color text;

-- ── address, show_address (step 261.11) ──────────────────────────────────────
ALTER TABLE properties ADD COLUMN IF NOT EXISTS address      text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS show_address boolean NOT NULL DEFAULT false;

-- ── deals_status, last_exported_at (step 261.4) ──────────────────────────────
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deals_status     text        NOT NULL DEFAULT 'draft';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_exported_at timestamptz;

-- CHECK constraint on deals_status — skip if already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint c
    JOIN   pg_class      t ON t.oid = c.conrelid
    WHERE  t.relname  = 'properties'
    AND    c.conname  = 'properties_deals_status_check'
    AND    c.contype  = 'c'
  ) THEN
    ALTER TABLE properties
      ADD CONSTRAINT properties_deals_status_check
      CHECK (deals_status IN ('draft', 'exported', 'published'));
    RAISE NOTICE 'OK  CHECK constraint properties_deals_status_check added';
  ELSE
    RAISE NOTICE 'SKIP CHECK constraint properties_deals_status_check already exists';
  END IF;
END;
$$;
