-- Migration: add intent and notes columns to leads table
-- Step 221 — 2026-03-16
--
-- intent: the chat-session intent key (e.g. viewing_request, general_question, golden_visa)
--         previously embedded in the summary text blob as "Intent: <value>"
-- notes:  the user's verbatim free-text message / preferred callback time
--         previously embedded in the summary text blob as "Notes: <value>"
--
-- Both columns are nullable — old rows have no values, they render safely as NULL.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS intent text,
  ADD COLUMN IF NOT EXISTS notes  text;
