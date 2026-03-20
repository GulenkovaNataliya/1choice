-- Migration: critical schema fix batch
-- Step 250.2 — 2026-03-20
--
-- Fixes identified in Step 250.1 audit.
-- All changes are strictly ADDITIVE — no tables/columns/data are dropped.
-- Every block is idempotent (IF NOT EXISTS / duplicate detection guards).
--
-- Sections:
--   A. updated_at auto-trigger on properties
--   B. leads.entry_intent column
--   C. Legacy columns price, size on properties (used by chat search)
--   D. UNIQUE constraints: properties.slug, property_code; locations.slug
--   E. UNIQUE constraint: property_slug_redirects.old_slug
--   F. Indexes for high-frequency queries
-- =============================================================================


-- =============================================================================
-- A. updated_at AUTO-TRIGGER ON properties
--
-- buildPayload() in PropertyForm.tsx does NOT set updated_at explicitly.
-- Without this trigger updated_at = created_at and never changes.
-- The freshness filter (.gte("updated_at", listingFreshnessCutoff())) would
-- hide all properties after 90 days from initial creation.
-- =============================================================================

-- Function: sets NEW.updated_at = now() before every UPDATE.
-- CREATE OR REPLACE is safe — existing callers on other tables are unaffected
-- because each trigger row carries its own reference to the function.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger: attach to properties only if not already present.
-- If a trigger with this exact name exists, we skip (idempotent).
-- If a trigger under a DIFFERENT name already sets updated_at, adding this
-- trigger is still safe — both fire and both set updated_at = now().
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_trigger  t
    JOIN   pg_class    c ON c.oid = t.tgrelid
    WHERE  t.tgname    = 'trg_properties_updated_at'
    AND    c.relname   = 'properties'
  ) THEN
    CREATE TRIGGER trg_properties_updated_at
      BEFORE UPDATE ON properties
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    RAISE NOTICE 'OK  [A] trigger trg_properties_updated_at created on properties';
  ELSE
    RAISE NOTICE 'SKIP[A] trigger trg_properties_updated_at already exists — no change';
  END IF;
END;
$$;


-- =============================================================================
-- B. leads.entry_intent COLUMN
--
-- /app/api/leads/route.ts inserts entry_intent on every lead submission.
-- If the column is missing every lead INSERT fails (500 response to users).
-- =============================================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS entry_intent text;
-- Note: IF NOT EXISTS makes this a no-op if the column already exists.


-- =============================================================================
-- C. LEGACY COLUMNS: price, size ON properties
--
-- lib/chat/propertySearch.ts selects these columns by name.
-- Supabase/PostgREST returns an error for non-existent column names, causing
-- the chat property search to silently return [] on every query.
--
-- If these columns already exist (as original pre-rename columns), ADD COLUMN
-- IF NOT EXISTS is a complete no-op — existing data and NULLs are untouched.
-- If they do not exist, they are added as nullable numeric columns.
-- =============================================================================

ALTER TABLE properties ADD COLUMN IF NOT EXISTS price  numeric;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS size   numeric;


-- =============================================================================
-- D1. UNIQUE CONSTRAINT: properties.slug
--
-- Duplicate slugs break public routing and property_slug_redirects lookups.
-- Guard: skip constraint if any non-NULL duplicates exist (safe, reports them).
-- =============================================================================

DO $$
DECLARE
  dup_count integer;
BEGIN
  -- Check whether ANY unique index already covers properties.slug
  IF EXISTS (
    SELECT 1
    FROM   pg_index     i
    JOIN   pg_class     c ON c.oid = i.indrelid
    JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE  c.relname    = 'properties'
    AND    a.attname    = 'slug'
    AND    i.indisunique = true
    AND    array_length(i.indkey, 1) = 1  -- single-column unique index
  ) THEN
    RAISE NOTICE 'SKIP[D1] properties.slug already has a unique index — no change';
    RETURN;
  END IF;

  -- Count groups of duplicate non-NULL slugs
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT slug
    FROM   properties
    WHERE  slug IS NOT NULL
    GROUP  BY slug
    HAVING COUNT(*) > 1
  ) dupes;

  IF dup_count > 0 THEN
    RAISE WARNING
      'SKIP[D1] properties.slug has % duplicate value group(s) — UNIQUE NOT applied. '
      'Fix with: SELECT slug, COUNT(*), array_agg(id) FROM properties '
      'WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1;',
      dup_count;
  ELSE
    ALTER TABLE properties ADD CONSTRAINT properties_slug_key UNIQUE (slug);
    RAISE NOTICE 'OK  [D1] properties.slug UNIQUE applied';
  END IF;
END;
$$;


-- =============================================================================
-- D2. UNIQUE CONSTRAINT: properties.property_code
--
-- generatePropertyCode() selects MAX and increments — a race condition can
-- produce duplicates under concurrent inserts without a DB-level guarantee.
-- =============================================================================

DO $$
DECLARE
  dup_count integer;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM   pg_index     i
    JOIN   pg_class     c ON c.oid = i.indrelid
    JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE  c.relname    = 'properties'
    AND    a.attname    = 'property_code'
    AND    i.indisunique = true
    AND    array_length(i.indkey, 1) = 1
  ) THEN
    RAISE NOTICE 'SKIP[D2] properties.property_code already has a unique index — no change';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT property_code
    FROM   properties
    WHERE  property_code IS NOT NULL
    GROUP  BY property_code
    HAVING COUNT(*) > 1
  ) dupes;

  IF dup_count > 0 THEN
    RAISE WARNING
      'SKIP[D2] properties.property_code has % duplicate value group(s) — UNIQUE NOT applied. '
      'Fix with: SELECT property_code, COUNT(*), array_agg(id) FROM properties '
      'WHERE property_code IS NOT NULL GROUP BY property_code HAVING COUNT(*) > 1;',
      dup_count;
  ELSE
    ALTER TABLE properties ADD CONSTRAINT properties_property_code_key UNIQUE (property_code);
    RAISE NOTICE 'OK  [D2] properties.property_code UNIQUE applied';
  END IF;
END;
$$;


-- =============================================================================
-- D3. UNIQUE CONSTRAINT: locations.slug
--
-- Properties reference locations by slug (soft FK). Duplicate slugs make the
-- area filter ambiguous. Also required for createAreaQuick to report conflicts.
-- =============================================================================

DO $$
DECLARE
  dup_count integer;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM   pg_index     i
    JOIN   pg_class     c ON c.oid = i.indrelid
    JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE  c.relname    = 'locations'
    AND    a.attname    = 'slug'
    AND    i.indisunique = true
    AND    array_length(i.indkey, 1) = 1
  ) THEN
    RAISE NOTICE 'SKIP[D3] locations.slug already has a unique index — no change';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT slug
    FROM   locations
    WHERE  slug IS NOT NULL
    GROUP  BY slug
    HAVING COUNT(*) > 1
  ) dupes;

  IF dup_count > 0 THEN
    RAISE WARNING
      'SKIP[D3] locations.slug has % duplicate value group(s) — UNIQUE NOT applied. '
      'Fix with: SELECT slug, COUNT(*), array_agg(id) FROM locations '
      'WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1;',
      dup_count;
  ELSE
    ALTER TABLE locations ADD CONSTRAINT locations_slug_key UNIQUE (slug);
    RAISE NOTICE 'OK  [D3] locations.slug UNIQUE applied';
  END IF;
END;
$$;


-- =============================================================================
-- E. UNIQUE CONSTRAINT: property_slug_redirects.old_slug
--
-- PropertyForm inserts old slugs on rename. Without UNIQUE, the same old_slug
-- can appear multiple times, making redirect resolution non-deterministic.
-- =============================================================================

DO $$
DECLARE
  dup_count integer;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM   pg_index     i
    JOIN   pg_class     c ON c.oid = i.indrelid
    JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE  c.relname    = 'property_slug_redirects'
    AND    a.attname    = 'old_slug'
    AND    i.indisunique = true
    AND    array_length(i.indkey, 1) = 1
  ) THEN
    RAISE NOTICE 'SKIP[E] property_slug_redirects.old_slug already has a unique index — no change';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT old_slug
    FROM   property_slug_redirects
    WHERE  old_slug IS NOT NULL
    GROUP  BY old_slug
    HAVING COUNT(*) > 1
  ) dupes;

  IF dup_count > 0 THEN
    RAISE WARNING
      'SKIP[E] property_slug_redirects.old_slug has % duplicate value group(s) — UNIQUE NOT applied. '
      'Fix with: SELECT old_slug, COUNT(*) FROM property_slug_redirects '
      'WHERE old_slug IS NOT NULL GROUP BY old_slug HAVING COUNT(*) > 1;',
      dup_count;
  ELSE
    ALTER TABLE property_slug_redirects
      ADD CONSTRAINT property_slug_redirects_old_slug_key UNIQUE (old_slug);
    RAISE NOTICE 'OK  [E] property_slug_redirects.old_slug UNIQUE applied';
  END IF;
END;
$$;


-- =============================================================================
-- F. INDEXES FOR HIGH-FREQUENCY QUERIES
--
-- CREATE INDEX IF NOT EXISTS is always safe — no-op if the index exists.
-- These do not conflict with any UNIQUE constraints added above
-- (UNIQUE implicitly creates its own index; these are non-unique read indexes).
-- =============================================================================

-- Public catalogue main filter: status + publish_1choice + freshness (updated_at)
-- Used by: /properties page, /properties/location/[slug] page, sitemap
CREATE INDEX IF NOT EXISTS idx_properties_status_publish_updated
  ON properties (status, publish_1choice, updated_at);

-- Location filter in catalogue and similar-property queries
-- Used by: /properties?location=, propertySearch.ts, [slug]/page.tsx
CREATE INDEX IF NOT EXISTS idx_properties_location
  ON properties (location);

-- Redirect resolution — every request for an unknown slug hits this table
-- Used by: /properties/[slug]/page.tsx on notFound path
CREATE INDEX IF NOT EXISTS idx_property_slug_redirects_old_slug
  ON property_slug_redirects (old_slug);
