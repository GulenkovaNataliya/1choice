-- Migration: custom_heating, custom_cooling free-text columns
-- Step 262.14 — 2026-03-24
--
-- Safe to run multiple times — all statements are idempotent.

ALTER TABLE properties ADD COLUMN IF NOT EXISTS custom_heating text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS custom_cooling text;
