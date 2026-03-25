-- Migration: add Hebrew + Arabic name columns to locations
-- Step 262.29 — 2026-03-26
--
-- Enables multilingual location matching in the AI property search.
-- extractLocation() in lib/chat/propertySearch.ts will now match
-- Hebrew/Arabic area names alongside the existing English name.
--
-- Both ADD COLUMN statements are IF NOT EXISTS — idempotent.
-- UPDATE statements are keyed by slug — safe no-op if slug doesn't exist.

ALTER TABLE locations ADD COLUMN IF NOT EXISTS name_he text;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS name_ar text;

-- ── South Athens Riviera ──────────────────────────────────────────────────────

UPDATE locations SET name_he = 'גליפדה',       name_ar = 'غليفادا'        WHERE slug = 'glyfada';
UPDATE locations SET name_he = 'בּוּלה',        name_ar = 'فولا'           WHERE slug = 'voula';
UPDATE locations SET name_he = 'בוּליאגמֶני',   name_ar = 'فولياغمني'      WHERE slug = 'vouliagmeni';
UPDATE locations SET name_he = 'גלאדס',        name_ar = 'غلاداس'         WHERE slug = 'gladas';
UPDATE locations SET name_he = 'קלמאקי',       name_ar = 'كالاماكي'       WHERE slug = 'kalamaki';
UPDATE locations SET name_he = 'אלימוס',       name_ar = 'أليموس'         WHERE slug = 'alimos';
UPDATE locations SET name_he = 'פלירון',       name_ar = 'فاليرو القديم'   WHERE slug = 'palaio-faliro';

-- ── Athens City ───────────────────────────────────────────────────────────────

UPDATE locations SET name_he = 'מרכז אתונה',   name_ar = 'مركز أثينا'     WHERE slug = 'athens-center';
UPDATE locations SET name_he = 'קוּקאקי',      name_ar = 'كوكاكي'         WHERE slug = 'koukaki';
UPDATE locations SET name_he = 'קולונאקי',     name_ar = 'كولوناكي'       WHERE slug = 'kolonaki';
UPDATE locations SET name_he = 'פּסיכיקו',     name_ar = 'بسيخيكو'        WHERE slug = 'psychiko';
UPDATE locations SET name_he = 'פּיליסיה',     name_ar = 'فيليسيا'        WHERE slug = 'filisia';
UPDATE locations SET name_he = 'חולארגוס',     name_ar = 'خولارغوس'       WHERE slug = 'cholargos';
UPDATE locations SET name_he = 'אמּבּלוקיפּי', name_ar = 'أمبلوكيبي'      WHERE slug = 'ambelokipi';
UPDATE locations SET name_he = 'נּאה-סמּירנּי',  name_ar = 'سميرنا الجديدة'  WHERE slug = 'nea-smyrni';
UPDATE locations SET name_he = 'נּאוֹס קוֹסמוֹס', name_ar = 'نيوس كوسموس'  WHERE slug = 'neos-kosmos';
UPDATE locations SET name_he = 'מוֹנאסטיראקי', name_ar = 'موناستيراكي'    WHERE slug = 'monastiraki';
UPDATE locations SET name_he = 'פלאקה',        name_ar = 'بلاكا'          WHERE slug = 'plaka';
UPDATE locations SET name_he = 'אֶקסַרְקֵיּא', name_ar = 'إكسارخيا'       WHERE slug = 'exarchia';
UPDATE locations SET name_he = 'פּאנגראטי',    name_ar = 'بانغراتي'       WHERE slug = 'pangrati';
UPDATE locations SET name_he = 'זוֹגראפּוּ',   name_ar = 'زوغرافو'        WHERE slug = 'zografou';

-- ── Northern Suburbs ──────────────────────────────────────────────────────────

UPDATE locations SET name_he = 'קיפיסיה',      name_ar = 'كيفيسيا'        WHERE slug = 'kifissia';
UPDATE locations SET name_he = 'מארוסי',       name_ar = 'ماروسي'         WHERE slug = 'marousi';
UPDATE locations SET name_he = 'חּרלאנּדרי',   name_ar = 'خارلاندري'      WHERE slug = 'chalandri';
UPDATE locations SET name_he = 'מּלוּסי',      name_ar = 'ميلوسي'         WHERE slug = 'melissia';
UPDATE locations SET name_he = 'אגּיאה-פּאראסקּוי', name_ar = 'أغيا باراسكيفي' WHERE slug = 'agia-paraskevi';
UPDATE locations SET name_he = 'בּריּלּיסיא',  name_ar = 'بريليسيا'       WHERE slug = 'vrilissia';
UPDATE locations SET name_he = 'פּנטּלי',      name_ar = 'بينتيلي'        WHERE slug = 'penteli';
UPDATE locations SET name_he = 'דיוּניסוֹס',   name_ar = 'ديونيسوس'       WHERE slug = 'dionyssos';

-- ── Piraeus & West ────────────────────────────────────────────────────────────

UPDATE locations SET name_he = 'פּיראוס',      name_ar = 'بيريوس'         WHERE slug = 'piraeus';
UPDATE locations SET name_he = 'קאסטלה',       name_ar = 'كاستيلا'        WHERE slug = 'kastela';
UPDATE locations SET name_he = 'מיקּרוֹלּימאנּוֹ', name_ar = 'ميكروليمانو'  WHERE slug = 'mikrolimano';
