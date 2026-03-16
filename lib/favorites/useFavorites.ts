"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "1choice_favorites";
// Custom event fired after every write so all useFavorites instances on the
// same page stay in sync without a global store.
const SYNC_EVENT = "1choice:favorites-changed";

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
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

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read from localStorage only after mount — SSR-safe.
  // Also subscribe to SYNC_EVENT so any toggle on the same page
  // (e.g. FavoriteButton inside a PropertyCard) updates all consumers.
  useEffect(() => {
    setIds(readIds());
    setHydrated(true);

    function onSync() {
      setIds(readIds());
    }
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id];
      writeIds(next);
      return next;
    });
  }, []);

  const isSaved = useCallback(
    (id: string): boolean => hydrated && ids.includes(id),
    [hydrated, ids],
  );

  return { ids, isSaved, toggle, hydrated };
}
