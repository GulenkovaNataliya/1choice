-- Migration: property_activity_log table
-- Step 259.2 — 2026-03-22
--
-- Append-only audit log for admin actions on properties.
-- Written by lib/admin/logActivity.ts — never throws, failures are silently warned.
--
-- Columns (must match logActivity.ts insert shape exactly):
--   property_id  — FK to properties.id; nullable to survive property deletion
--   action       — one of 26 ActivityAction string literals defined in logActivity.ts
--   actor_email  — email of the admin who performed the action (from Supabase auth)
--   meta         — arbitrary JSON payload (e.g. { property_code: "PROP0001" })
--   created_at   — DB default; logActivity never inserts this column
--
-- Design decisions:
--   - property_id is nullable (SET NULL on delete): log rows are preserved after property deletion
--   - No UPDATE/DELETE policies: log is append-only by design (immutable audit trail)
--   - No UNIQUE constraints: same action may be logged multiple times legitimately
--   - actor_email is nullable: future-proofing if user is deleted from auth
--
-- RLS:
--   - SELECT: authenticated only — activity log is internal, never exposed publicly
--   - INSERT: authenticated only — only admin sessions write logs (via logActivity.ts)
--   - No UPDATE, no DELETE: enforces append-only audit trail

CREATE TABLE IF NOT EXISTS property_activity_log (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id  uuid        REFERENCES properties(id) ON DELETE SET NULL,
  action       text        NOT NULL,
  actor_email  text,
  meta         jsonb       DEFAULT '{}',
  created_at   timestamptz DEFAULT now()
);

-- Index on property_id for "show log for this property" queries
CREATE INDEX IF NOT EXISTS idx_property_activity_log_property_id
  ON property_activity_log (property_id);

-- Index on created_at for time-range queries (admin dashboard audit views)
CREATE INDEX IF NOT EXISTS idx_property_activity_log_created_at
  ON property_activity_log (created_at DESC);

-- RLS
ALTER TABLE property_activity_log ENABLE ROW LEVEL SECURITY;

-- Only authenticated admin users may read the activity log
CREATE POLICY "pal_select_authenticated" ON property_activity_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- logActivity.ts uses the browser client (anon key + user session) to insert
-- auth.role() = 'authenticated' covers this use case
CREATE POLICY "pal_insert_authenticated" ON property_activity_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- No UPDATE policy — log rows are immutable
-- No DELETE policy — log rows are permanent (append-only audit trail)
