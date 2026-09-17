'use client';

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_STORAGE_KEY = 'toolbox_favorites_v1';
const USAGE_STORAGE_KEY = 'toolbox_usage_v1';

// Custom event name for cross-component sync
const SYNC_EVENT = 'toolbox_favorites_sync';

export function getStoredFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(favs: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  } catch {
    // Ignore storage quota or disabled localStorage
  }
}

export function getStoredUsage(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordToolUsage(slug: string) {
  if (typeof window === 'undefined') return;
  try {
    const usage = getStoredUsage();
    usage[slug] = (usage[slug] || 0) + 1;
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // Ignore
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFavorites(getStoredFavorites());

    const handleSync = () => {
      setFavorites(getStoredFavorites());
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const isFavorite = useCallback(
    (slug: string) => {
      return mounted && favorites.includes(slug);
    },
    [favorites, mounted]
  );

  const toggleFavorite = useCallback(
    (slug: string, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const current = getStoredFavorites();
      const updated = current.includes(slug)
        ? current.filter((s) => s !== slug)
        : [...current, slug];
      saveFavorites(updated);
      setFavorites(updated);
    },
    []
  );

  return { favorites: mounted ? favorites : [], isFavorite, toggleFavorite, mounted };
}
