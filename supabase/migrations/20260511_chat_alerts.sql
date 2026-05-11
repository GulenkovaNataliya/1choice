-- Migration: create chat_alerts table for high-intent chat signals
-- Step 041 - 2026-05-11
--
-- Chat alerts are intentionally separate from submitted leads:
--   - leads = submitted contact forms with contact data
--   - chat_alerts = early interest signals before form submit

CREATE TABLE IF NOT EXISTS chat_alerts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  status            text NOT NULL DEFAULT 'new',
  intent            text,
  reason            text NOT NULL,
  message_excerpt   text,
  page_url          text,
  property_title    text,
  property_code     text,
  property_location text,
  contact_found     boolean NOT NULL DEFAULT false,
  source            text,
  language          text,
  CONSTRAINT chat_alerts_status_check
    CHECK (status IN ('new', 'reviewed', 'ignored'))
);

CREATE INDEX IF NOT EXISTS chat_alerts_created_at_idx
  ON chat_alerts (created_at DESC);

CREATE INDEX IF NOT EXISTS chat_alerts_status_idx
  ON chat_alerts (status);

CREATE INDEX IF NOT EXISTS chat_alerts_intent_idx
  ON chat_alerts (intent);

ALTER TABLE chat_alerts ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated admin users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_alerts' AND policyname = 'chat_alerts_select_authenticated'
  ) THEN
    CREATE POLICY "chat_alerts_select_authenticated" ON chat_alerts
      FOR SELECT
      USING (auth.role() = 'authenticated');
    RAISE NOTICE 'OK  chat_alerts_select_authenticated created on chat_alerts';
  ELSE
    RAISE NOTICE 'SKIP chat_alerts_select_authenticated already exists on chat_alerts';
  END IF;
END;
$$;

-- UPDATE: authenticated admin users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_alerts' AND policyname = 'chat_alerts_update_authenticated'
  ) THEN
    CREATE POLICY "chat_alerts_update_authenticated" ON chat_alerts
      FOR UPDATE
      USING     (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
    RAISE NOTICE 'OK  chat_alerts_update_authenticated created on chat_alerts';
  ELSE
    RAISE NOTICE 'SKIP chat_alerts_update_authenticated already exists on chat_alerts';
  END IF;
END;
$$;

-- DELETE: authenticated admin users only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'chat_alerts' AND policyname = 'chat_alerts_delete_authenticated'
  ) THEN
    CREATE POLICY "chat_alerts_delete_authenticated" ON chat_alerts
      FOR DELETE
      USING (auth.role() = 'authenticated');
    RAISE NOTICE 'OK  chat_alerts_delete_authenticated created on chat_alerts';
  ELSE
    RAISE NOTICE 'SKIP chat_alerts_delete_authenticated already exists on chat_alerts';
  END IF;
END;
$$;
