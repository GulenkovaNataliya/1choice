-- Migration: property_access_tokens table
-- Step 259.2 — 2026-03-22
--
-- Stores secure access tokens for private collection properties.
-- Each token maps to one property; accessing /private/<token> resolves the property.
--
-- Design decisions:
--   - token is UNIQUE: each token is a UUID v4 (crypto.randomUUID()), globally unique
--   - property_id FK with ON DELETE CASCADE: token is automatically removed when property is deleted
--   - One token per property enforced in application logic (POST deletes old token before inserting new)
--   - No expiry column: revocation is done by DELETE (explicit) or CASCADE (property deleted)
--   - created_at is DB default — application never inserts it manually
--
-- RLS:
--   - Public SELECT: intentionally allowed — token lookup is the access gate,
--     and the token itself is the secret (UUID, not guessable)
--   - INSERT/DELETE: authenticated only — only admin users generate/revoke tokens
--   - No UPDATE policy: tokens are replaced (DELETE + INSERT), never mutated

CREATE TABLE IF NOT EXISTS property_access_tokens (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  token       text        NOT NULL UNIQUE,
  property_id uuid        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

-- Index on property_id for fast "does this property have a token?" lookup
CREATE INDEX IF NOT EXISTS idx_property_access_tokens_property_id
  ON property_access_tokens (property_id);

-- RLS
ALTER TABLE property_access_tokens ENABLE ROW LEVEL SECURITY;

-- Public token lookup — the UUID token itself is the access credential
CREATE POLICY "pat_select_public" ON property_access_tokens
  FOR SELECT USING (true);

-- Only authenticated admin users may generate tokens
CREATE POLICY "pat_insert_authenticated" ON property_access_tokens
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated admin users may revoke tokens
CREATE POLICY "pat_delete_authenticated" ON property_access_tokens
  FOR DELETE USING (auth.role() = 'authenticated');

-- No UPDATE policy — tokens are replaced (DELETE + INSERT), never mutated in place
