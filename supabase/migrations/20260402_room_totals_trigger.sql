-- Migration: auto-calculate room totals from level_details
-- Step 312.1 — 2026-04-02
--
-- Creates a BEFORE INSERT OR UPDATE trigger that sums room counts
-- across all level_details entries and writes them into the flat
-- total columns (bedrooms, bathrooms, etc.) used by filters and AI.
--
-- If level_details is NULL or empty → all totals set to NULL.
-- If level_details is present → totals = sum across all levels.

-- ── Function ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION calculate_room_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  lvl       jsonb;
  v_bedrooms        integer := 0;
  v_bathrooms       integer := 0;
  v_wc              integer := 0;
  v_kitchens        integer := 0;
  v_living_rooms    integer := 0;
  v_storage_rooms   integer := 0;
  v_versatile_rooms integer := 0;
  has_levels        boolean := false;
BEGIN
  -- Only process if level_details is a non-empty JSON array
  IF NEW.level_details IS NOT NULL
     AND jsonb_typeof(NEW.level_details) = 'array'
     AND jsonb_array_length(NEW.level_details) > 0
  THEN
    FOR lvl IN SELECT * FROM jsonb_array_elements(NEW.level_details)
    LOOP
      has_levels := true;
      v_bedrooms        := v_bedrooms        + COALESCE((lvl->>'bedrooms')::integer,        0);
      v_bathrooms       := v_bathrooms       + COALESCE((lvl->>'bathrooms')::integer,       0);
      v_wc              := v_wc              + COALESCE((lvl->>'wc')::integer,              0);
      v_kitchens        := v_kitchens        + COALESCE((lvl->>'kitchens')::integer,        0);
      v_living_rooms    := v_living_rooms    + COALESCE((lvl->>'living_rooms')::integer,    0);
      v_storage_rooms   := v_storage_rooms   + COALESCE((lvl->>'storage_rooms')::integer,   0);
      v_versatile_rooms := v_versatile_rooms + COALESCE((lvl->>'versatile_rooms')::integer, 0);
    END LOOP;
  END IF;

  IF has_levels THEN
    -- Write nulls for zero totals — keeps filters clean (0 beds ≠ "has 0 beds")
    NEW.bedrooms        := NULLIF(v_bedrooms,        0);
    NEW.bathrooms       := NULLIF(v_bathrooms,       0);
    NEW.wc              := NULLIF(v_wc,              0);
    NEW.kitchens        := NULLIF(v_kitchens,        0);
    NEW.living_rooms    := NULLIF(v_living_rooms,    0);
    NEW.storage_rooms   := NULLIF(v_storage_rooms,   0);
    NEW.versatile_rooms := NULLIF(v_versatile_rooms, 0);
  ELSE
    -- No level_details → clear totals
    NEW.bedrooms        := NULL;
    NEW.bathrooms       := NULL;
    NEW.wc              := NULL;
    NEW.kitchens        := NULL;
    NEW.living_rooms    := NULL;
    NEW.storage_rooms   := NULL;
    NEW.versatile_rooms := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- ── Trigger ───────────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_room_totals ON properties;

CREATE TRIGGER trg_room_totals
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION calculate_room_totals();
