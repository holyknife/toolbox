'use client';

import { useState, useRef, useEffect } from 'react';
import { User, LogIn, LogOut, Clock, Star, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { openAuthModal } from './auth-modal';
import { useRecentTools, useFavorites } from '@/lib/favorites';

export default function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const { recentTools } = useRecentTools(20);
  const { favorites } = useFavorites();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  if (loading) {
    return <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={openAuthModal}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#385ee8] text-white hover:bg-[#2d4ec7] px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:shadow hover:brightness-105 active:scale-95"
        title="Sign in to sync your tools"
      >
        <LogIn size={14} className="stroke-[2.2]" />
        <span>Sign in</span>
      </button>
    );
  }

  const initial = (user.name || user.email || 'U')[0].toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 rounded-lg border border-border bg-panel p-1.5 pr-2.5 text-xs font-medium text-text hover:border-accent transition-colors"
        aria-expanded={menuOpen}
        aria-haspopup="true"
        title={`Logged in as ${user.email}`}
      >
        <span className="w-6 h-6 rounded-md bg-accent text-accent-contrast flex items-center justify-center font-bold text-xs">
          {initial}
        </span>
        <span className="max-w-[100px] truncate text-xs font-medium">{user.name}</span>
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-panel p-2 shadow-xl z-50 animate-page-enter">
          <div className="px-2.5 py-2 border-b border-border/60 mb-1">
            <div className="text-xs font-semibold text-text truncate">{user.name}</div>
            {user.email && <div className="text-[11px] text-dim truncate">{user.email}</div>}
          </div>

          <div className="px-2.5 py-1.5 text-[11px] text-dim flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> Recent tools
            </span>
            <span className="font-semibold text-text">{recentTools.length}</span>
          </div>

          <div className="px-2.5 py-1.5 text-[11px] text-dim flex items-center justify-between border-b border-border/60 pb-2 mb-1">
            <span className="flex items-center gap-1.5">
              <Star size={12} /> Pinned
            </span>
            <span className="font-semibold text-text">{favorites.length}</span>
          </div>

          <button
            type="button"
            onClick={async () => {
              setMenuOpen(false);
              await signOut();
            }}
            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors text-left"
          >
            <LogOut size={13} />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
