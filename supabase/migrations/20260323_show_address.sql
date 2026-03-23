-- Migration: address + show_address columns on properties
-- Step 261.11 — 2026-03-23
--
-- address      — exact street address of the property (optional, admin-only input).
--                Previously stored only as UI state in PropertyForm for geocoding;
--                now persisted to DB so it can be shown to visitors when permitted.
--
-- show_address — visibility toggle for the exact address on public property pages.
--                DEFAULT false: address is hidden from visitors by default.
--                When true: address is shown on the public detail page.
--                Chatbot safety: address is intentionally excluded from chat context
--                regardless of this flag (chat only receives location_text / area name).

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS address      text,
  ADD COLUMN IF NOT EXISTS show_address boolean NOT NULL DEFAULT false;
