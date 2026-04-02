-- Migration: add Russian name stems to locations
-- Step 311 — 2026-04-02
--
-- Enables Russian location matching in the AI property search.
-- extractLocation() in lib/chat/propertySearch.ts will now match Russian area names.
--
-- Stems (not full nominative) are used so the includes() check matches both
-- nominative and prepositional forms:
--   "глифад" matches "глифада" AND "глифаде"
--   "вул"    matches "вула" AND "вуле"
-- Sorted longest-first in code, so longer stems (вулиагмен) beat shorter (вул).

ALTER TABLE locations ADD COLUMN IF NOT EXISTS name_ru text;

-- ── South Athens Riviera ──────────────────────────────────────────────────────

UPDATE locations SET name_ru = 'глифад'        WHERE slug = 'glyfada';
UPDATE locations SET name_ru = 'вул'           WHERE slug = 'voula';
UPDATE locations SET name_ru = 'вулиагмен'     WHERE slug = 'vouliagmeni';
UPDATE locations SET name_ru = 'гладас'        WHERE slug = 'gladas';
UPDATE locations SET name_ru = 'каламак'       WHERE slug = 'kalamaki';
UPDATE locations SET name_ru = 'алимос'        WHERE slug = 'alimos';
UPDATE locations SET name_ru = 'фалиро'        WHERE slug = 'palaio-faliro';

-- ── Athens City ───────────────────────────────────────────────────────────────

UPDATE locations SET name_ru = 'афин'          WHERE slug = 'athens-center';
UPDATE locations SET name_ru = 'кукак'         WHERE slug = 'koukaki';
UPDATE locations SET name_ru = 'колонак'       WHERE slug = 'kolonaki';
UPDATE locations SET name_ru = 'психик'        WHERE slug = 'psychiko';
UPDATE locations SET name_ru = 'филис'         WHERE slug = 'filisia';
UPDATE locations SET name_ru = 'холаргос'      WHERE slug = 'cholargos';
UPDATE locations SET name_ru = 'амбелокип'     WHERE slug = 'ambelokipi';
UPDATE locations SET name_ru = 'неа смирн'     WHERE slug = 'nea-smyrni';
UPDATE locations SET name_ru = 'неос космос'   WHERE slug = 'neos-kosmos';
UPDATE locations SET name_ru = 'монастирак'    WHERE slug = 'monastiraki';
UPDATE locations SET name_ru = 'плак'          WHERE slug = 'plaka';
UPDATE locations SET name_ru = 'экзархи'       WHERE slug = 'exarchia';
UPDATE locations SET name_ru = 'пангради'      WHERE slug = 'pangrati';
UPDATE locations SET name_ru = 'зограф'        WHERE slug = 'zografou';

-- ── Northern Suburbs ──────────────────────────────────────────────────────────

UPDATE locations SET name_ru = 'кифис'         WHERE slug = 'kifissia';
UPDATE locations SET name_ru = 'марус'         WHERE slug = 'marousi';
UPDATE locations SET name_ru = 'халандр'       WHERE slug = 'chalandri';
UPDATE locations SET name_ru = 'мелис'         WHERE slug = 'melissia';
UPDATE locations SET name_ru = 'параскев'      WHERE slug = 'agia-paraskevi';
UPDATE locations SET name_ru = 'врилис'        WHERE slug = 'vrilissia';
UPDATE locations SET name_ru = 'пентел'        WHERE slug = 'penteli';
UPDATE locations SET name_ru = 'дионисос'      WHERE slug = 'dionyssos';

-- ── Piraeus & West ────────────────────────────────────────────────────────────

UPDATE locations SET name_ru = 'пире'          WHERE slug = 'piraeus';
UPDATE locations SET name_ru = 'кастел'        WHERE slug = 'kastela';
UPDATE locations SET name_ru = 'микролиман'    WHERE slug = 'mikrolimano';
