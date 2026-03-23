-- Migration: deals_status and last_exported_at columns on properties
-- Step 261.4 — 2026-03-23
--
-- Adds DB foundation for the Deals export workflow.
--
-- deals_status — tracks where a deal is in the export lifecycle:
--   'draft'     — not yet exported (default for all rows, new and existing)
--   'exported'  — copy action was performed (JSON / HTML / slug / SEO)
--   'published' — manually marked as published in the destination channel
--
-- last_exported_at — timestamp of the most recent copy/export action.
--   Updated by the application when any export copy is performed.
--   NULL means never exported.
--
-- Safety:
--   - ADD COLUMN IF NOT EXISTS — no-op if already present
--   - CHECK constraint added via DO block to skip if already exists
--   - INDEX added with IF NOT EXISTS
--   - Existing rows receive deals_status='draft' via DEFAULT (no UPDATE needed)

-- ── 1. Add columns ────────────────────────────────────────────────────────────

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS deals_status    text        NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS last_exported_at timestamptz NULL;

-- ── 2. CHECK constraint ───────────────────────────────────────────────────────
-- Prevents any value outside the allowed set from being stored.
-- Wrapped in DO block so it is skipped if the constraint already exists.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint c
    JOIN   pg_class      t ON t.oid = c.conrelid
    WHERE  t.relname   = 'properties'
    AND    c.conname   = 'properties_deals_status_check'
    AND    c.contype   = 'c'
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

-- ── 3. Index ──────────────────────────────────────────────────────────────────
-- Supports "show all unexported deals" and "show all published deals" queries
-- from the admin panel and PropertiesTable filter.

CREATE INDEX IF NOT EXISTS idx_properties_deals_status
  ON properties (deals_status);
