/**
 * Shared filters for public property catalogue queries.
 * Applied to all public-facing listing surfaces.
 * NOT applied to admin queries.
 */

/** Number of days after which an unupdated listing is hidden from public catalogue. */
export const FRESHNESS_DAYS = 90;

/**
 * Returns the ISO timestamp cutoff for freshness filtering.
 * Called at request time so each page render uses the current date.
 *
 * Usage:  .gte("updated_at", listingFreshnessCutoff())
 */
export function listingFreshnessCutoff(): string {
  return new Date(Date.now() - FRESHNESS_DAYS * 24 * 60 * 60 * 1000).toISOString();
}
