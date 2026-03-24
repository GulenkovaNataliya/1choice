-- Migration: drop NOT NULL constraint on legacy alias columns price and size
-- Step 262.6 — 2026-03-24
--
-- Context:
--   The original properties table has `price numeric NOT NULL` and
--   `size numeric NOT NULL` from before the rename to price_eur / size_sqm.
--   buildPayload() sends price_eur and size_sqm, not the legacy names.
--   Without this fix every INSERT fails with:
--     "null value in column "price" violates not-null constraint"
--
-- Fix:
--   Make both legacy columns nullable so INSERT can omit them or send NULL.
--   buildPayload() is updated in the same step to keep both columns in sync,
--   so the chat search (which reads `price` and `size`) continues to work.
--
-- Safe: ALTER COLUMN … DROP NOT NULL never removes data or changes types.

ALTER TABLE properties ALTER COLUMN price DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN size  DROP NOT NULL;
