-- Migration: create site_settings table
-- Step 248 — 2026-03-19
--
-- Single-row table (id = 1 enforced) storing editable site-wide settings.
-- Public read is allowed (no sensitive data). Write requires authenticated session.

CREATE TABLE IF NOT EXISTS site_settings (
  id               integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  company_name     text,
  registration_number text,
  company_address  text,
  contact_phone    text,
  contact_email    text,
  office_hours     text,
  logo_url         text,
  updated_at       timestamptz DEFAULT now()
);

-- Seed with a single empty row so UPDATE always hits a row
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (used by public pages)
CREATE POLICY "site_settings_read" ON site_settings
  FOR SELECT USING (true);

-- Only authenticated users (admins) may write
CREATE POLICY "site_settings_write" ON site_settings
  FOR ALL USING (auth.role() = 'authenticated');
