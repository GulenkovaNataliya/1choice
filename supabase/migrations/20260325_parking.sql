-- Migration: add parking boolean column to properties
-- Step 262.25 — 2026-03-25
-- Idempotent — safe to run on any instance.

ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking boolean;
