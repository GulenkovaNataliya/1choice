-- Migration: custom badges dictionary + property badge columns
-- Step 251 — 2026-03-20
--
-- custom_badges: shared badge dictionary (text only; color lives on property)
-- properties.custom_badge / custom_badge_color: per-property selection

-- ── custom_badges table ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS custom_badges (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Case-insensitive unique index — prevents "New Listing" and "new listing" coexisting
CREATE UNIQUE INDEX IF NOT EXISTS custom_badges_name_ci
  ON custom_badges (LOWER(name));

-- RLS
ALTER TABLE custom_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_badges_read" ON custom_badges
  FOR SELECT USING (true);

CREATE POLICY "custom_badges_insert" ON custom_badges
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ── Extend properties table ───────────────────────────────────────────────────

-- custom_badge: text reference to custom_badges.name (soft, no FK needed)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS custom_badge       text;

-- custom_badge_color: enum stored as text — values: red | violet | light
ALTER TABLE properties ADD COLUMN IF NOT EXISTS custom_badge_color text;
