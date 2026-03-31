-- Step 278: Rename JSONB key is_maisonette_duplex → is_maisonette in level_details
-- Renames the key inside every element of the level_details JSONB array.
-- Rows without level_details (NULL) are unaffected.

UPDATE properties
SET level_details = (
  SELECT jsonb_agg(
    CASE
      WHEN elem ? 'is_maisonette_duplex'
      THEN (elem - 'is_maisonette_duplex') || jsonb_build_object('is_maisonette', elem -> 'is_maisonette_duplex')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(level_details) AS elem
)
WHERE level_details IS NOT NULL;
