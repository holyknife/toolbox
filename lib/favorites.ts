'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabaseAuth, supabaseDb } from './supabase';
import { tools, type Tool } from './tools-registry';

const FAVORITES_STORAGE_KEY = 'toolbox_favorites_v1';
const USAGE_STORAGE_KEY = 'toolbox_usage_v1';
const RECENT_USAGE_STORAGE_KEY = 'toolbox_recent_usage_v2';

// Custom event name for cross-component sync
export const SYNC_EVENT = 'toolbox_favorites_sync';
export const USAGE_SYNC_EVENT = 'toolbox_usage_sync';

export interface LocalToolUsage {
  lastUsedAt: number;
  count: number;
}

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
    // Ignore storage quota
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

export function getStoredRecentUsage(): Record<string, LocalToolUsage> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(RECENT_USAGE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function recordToolUsage(slug: string) {
  if (typeof window === 'undefined') return;
  try {
    // 1. Simple count storage
    const usage = getStoredUsage();
    usage[slug] = (usage[slug] || 0) + 1;
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));

    // 2. Timestamped recent usage
    const recent = getStoredRecentUsage();
    recent[slug] = {
      lastUsedAt: Date.now(),
      count: (recent[slug]?.count || 0) + 1,
    };
    localStorage.setItem(RECENT_USAGE_STORAGE_KEY, JSON.stringify(recent));
    window.dispatchEvent(new CustomEvent(USAGE_SYNC_EVENT));

    // 3. Supabase remote sync if logged in
    const session = supabaseAuth.getSession();
    if (session?.user?.id && session.access_token) {
      supabaseDb.recordUsage(session.user.id, session.access_token, slug).catch(() => {});
    }
  } catch {
    // Ignore storage errors
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFavorites(getStoredFavorites());

    // If logged in, fetch from remote and merge
    const session = supabaseAuth.getSession();
    if (session?.user?.id && session.access_token) {
      supabaseDb.fetchFavorites(session.user.id, session.access_token).then((remoteFavs) => {
        if (remoteFavs.length > 0) {
          const localFavs = getStoredFavorites();
          const merged = Array.from(new Set([...localFavs, ...remoteFavs]));
          saveFavorites(merged);
          setFavorites(merged);
        }
      }).catch(() => {});
    }

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
      const willBeFav = !current.includes(slug);
      const updated = willBeFav
        ? [...current, slug]
        : current.filter((s) => s !== slug);

      saveFavorites(updated);
      setFavorites(updated);

      // Sync with Supabase if logged in
      const session = supabaseAuth.getSession();
      if (session?.user?.id && session.access_token) {
        supabaseDb.setFavorite(session.user.id, session.access_token, slug, willBeFav).catch(() => {});
      }
    },
    []
  );

  return { favorites: mounted ? favorites : [], isFavorite, toggleFavorite, mounted };
}

/** Hook to get recently used tools ordered by lastUsedAt DESC */
export function useRecentTools(limit: number = 6) {
  const [recentTools, setRecentTools] = useState<{ tool: Tool; lastUsedAt: number; count: number }[]>([]);
  const [mounted, setMounted] = useState(false);

  const computeRecent = useCallback(() => {
    const raw = getStoredRecentUsage();
    const list: { tool: Tool; lastUsedAt: number; count: number }[] = [];

    for (const [slug, data] of Object.entries(raw)) {
      const tool = tools.find((t) => t.slug === slug);
      if (tool) {
        list.push({
          tool,
          lastUsedAt: data.lastUsedAt,
          count: data.count,
        });
      }
    }

    list.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
    return list.slice(0, limit);
  }, [limit]);

  useEffect(() => {
    setMounted(true);
    setRecentTools(computeRecent());

    // Sync from Supabase if logged in
    const session = supabaseAuth.getSession();
    if (session?.user?.id && session.access_token) {
      supabaseDb.fetchUsage(session.user.id, session.access_token).then((rows) => {
        if (rows && rows.length > 0) {
          const local = getStoredRecentUsage();
          let updated = false;

          for (const row of rows) {
            const time = new Date(row.last_used_at).getTime();
            if (!local[row.tool_slug] || local[row.tool_slug].lastUsedAt < time) {
              local[row.tool_slug] = {
                lastUsedAt: time,
                count: Math.max(local[row.tool_slug]?.count || 0, row.use_count),
              };
              updated = true;
            }
          }

          if (updated && typeof window !== 'undefined') {
            localStorage.setItem(RECENT_USAGE_STORAGE_KEY, JSON.stringify(local));
            setRecentTools(computeRecent());
          }
        }
      }).catch(() => {});
    }

    const handleSync = () => {
      setRecentTools(computeRecent());
    };

    window.addEventListener(USAGE_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(USAGE_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [computeRecent]);

  return { recentTools: mounted ? recentTools : [], mounted };
}
