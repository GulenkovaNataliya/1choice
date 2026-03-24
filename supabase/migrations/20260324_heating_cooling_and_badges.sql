-- Migration: heating_type, cooling_type columns + custom_badges table
-- Step 262.11 — 2026-03-24
--
-- Safe to run multiple times — all statements are idempotent.

-- ── 1. Heating / Cooling columns on properties ────────────────────────────────

ALTER TABLE properties ADD COLUMN IF NOT EXISTS heating_type text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cooling_type text;

-- ── 2. custom_badges table (step 251 / 20260320_custom_badges.sql) ────────────
--
-- Ensures the badge dictionary exists even if the earlier migration was missed.

CREATE TABLE IF NOT EXISTS custom_badges (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Case-insensitive unique index
CREATE UNIQUE INDEX IF NOT EXISTS custom_badges_name_ci
  ON custom_badges (LOWER(name));

-- RLS
ALTER TABLE custom_badges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'custom_badges' AND policyname = 'custom_badges_read'
  ) THEN
    CREATE POLICY "custom_badges_read" ON custom_badges
      FOR SELECT USING (true);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'custom_badges' AND policyname = 'custom_badges_insert'
  ) THEN
    CREATE POLICY "custom_badges_insert" ON custom_badges
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END;
$$;
