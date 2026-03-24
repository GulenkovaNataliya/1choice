-- Migration: furnished, custom_furnished columns
-- Step 262.16 — 2026-03-24
--
-- Safe to run multiple times — all statements are idempotent.

ALTER TABLE properties ADD COLUMN IF NOT EXISTS furnished text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS custom_furnished text;
