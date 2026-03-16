"use client";

import { useState, useEffect, useCallback } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "1choice_compare";
const SYNC_EVENT  = "1choice:compare-changed";

/** Maximum number of properties that can be compared at once. */
export const COMPARE_MAX = 3;

// ── Storage helpers ───────────────────────────────────────────────────────────

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    // Guard: must be a string array, cap at COMPARE_MAX to survive stale data
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[])
      .filter((x): x is string => typeof x === "string")
      .slice(0, COMPARE_MAX);
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export type UseCompareReturn = {
  /** Current list of property ids queued for comparison. */
  ids: string[];
  /** Number of properties currently in compare (convenience alias for ids.length). */
  count: number;
  /** True when COMPARE_MAX has been reached — no more ids can be added. */
  atLimit: boolean;
  /** True after localStorage has been read; false during SSR / before mount. */
  hydrated: boolean;
  /** Returns true if the given property id is in the compare list. */
  isCompared: (id: string) => boolean;
  /**
   * Toggle compare state for a property.
   * - If already compared   → removes it.
   * - If not compared AND count < COMPARE_MAX → adds it.
   * - If not compared AND atLimit → no-op; returns false.
   *
   * Returns true if the state changed, false if the add was blocked by the limit.
   */
  toggle: (id: string) => boolean;
  /** Add a property. No-op if already present or at limit. Returns true if added. */
  add: (id: string) => boolean;
  /** Remove a property by id. No-op if not present. */
  remove: (id: string) => void;
  /** Remove all properties from the compare list. */
  clear: () => void;
};

export function useCompare(): UseCompareReturn {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read localStorage only after mount — SSR-safe.
  // Subscribe to SYNC_EVENT so all useCompare instances on the page stay in
  // sync (e.g. compare bar + toggle button on the same page).
  useEffect(() => {
    setIds(readIds());
    setHydrated(true);

    function onSync() {
      setIds(readIds());
    }
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, []);

  // ── Mutators ───────────────────────────────────────────────────────────────

  const add = useCallback((id: string): boolean => {
    let added = false;
    setIds(prev => {
      if (prev.includes(id)) return prev;       // already present
      if (prev.length >= COMPARE_MAX) return prev; // at limit
      const next = [...prev, id];
      writeIds(next);
      added = true;
      return next;
    });
    return added;
  }, []);

  const remove = useCallback((id: string): void => {
    setIds(prev => {
      if (!prev.includes(id)) return prev;
      const next = prev.filter(x => x !== id);
      writeIds(next);
      return next;
    });
  }, []);

  const toggle = useCallback((id: string): boolean => {
    let changed = false;
    setIds(prev => {
      if (prev.includes(id)) {
        // Remove
        const next = prev.filter(x => x !== id);
        writeIds(next);
        changed = true;
        return next;
      }
      if (prev.length >= COMPARE_MAX) {
        // At limit — block silently
        changed = false;
        return prev;
      }
      // Add
      const next = [...prev, id];
      writeIds(next);
      changed = true;
      return next;
    });
    return changed;
  }, []);

  const clear = useCallback((): void => {
    setIds([]);
    writeIds([]);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────

  const isCompared = useCallback(
    (id: string): boolean => hydrated && ids.includes(id),
    [hydrated, ids],
  );

  return {
    ids,
    count:     ids.length,
    atLimit:   ids.length >= COMPARE_MAX,
    hydrated,
    isCompared,
    toggle,
    add,
    remove,
    clear,
  };
}
