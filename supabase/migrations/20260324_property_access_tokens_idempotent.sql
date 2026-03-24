-- Migration: property_access_tokens table (idempotent re-creation)
-- Step 262.13 — 2026-03-24
--
-- The original migration 20260322_property_access_tokens.sql was never executed
-- in the Supabase database, causing the schema-cache error:
--   "Could not find the table 'public.property_access_tokens' in the schema cache"
--
-- This migration is fully idempotent — safe to run multiple times.
--
-- Table design:
--   - token is UNIQUE (UUID v4 via crypto.randomUUID() in the API route)
--   - property_id FK with ON DELETE CASCADE
--   - One token per property enforced in application logic (POST deletes old before insert)
--   - No expiry column: revocation via DELETE or CASCADE
--   - created_at is DB default — never inserted manually

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS property_access_tokens (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  token       text        NOT NULL UNIQUE,
  property_id uuid        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

-- ── Index ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_property_access_tokens_property_id
  ON property_access_tokens (property_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE property_access_tokens ENABLE ROW LEVEL SECURITY;

-- Public SELECT: token UUID is the access credential (not guessable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'property_access_tokens' AND policyname = 'pat_select_public'
  ) THEN
    CREATE POLICY "pat_select_public" ON property_access_tokens
      FOR SELECT USING (true);
  END IF;
END;
$$;

-- Authenticated INSERT (admin generates tokens)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'property_access_tokens' AND policyname = 'pat_insert_authenticated'
  ) THEN
    CREATE POLICY "pat_insert_authenticated" ON property_access_tokens
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END;
$$;

-- Authenticated DELETE (admin revokes tokens)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'property_access_tokens' AND policyname = 'pat_delete_authenticated'
  ) THEN
    CREATE POLICY "pat_delete_authenticated" ON property_access_tokens
      FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END;
$$;

-- No UPDATE policy: tokens are replaced (DELETE + INSERT), never mutated in place
