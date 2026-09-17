'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { useFavorites } from '@/lib/favorites';

interface FavoriteButtonProps {
  slug: string;
  className?: string;
  size?: number;
  label?: string;
  showLabel?: boolean;
}

export default function FavoriteButton({
  slug,
  className = '',
  size = 18,
  label = 'Pin tool',
  showLabel = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, mounted } = useFavorites();
  const favorited = isFavorite(slug);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label={label}
        className={`favorite-btn text-muted-foreground/40 hover:text-amber-500 transition-colors p-1.5 rounded-lg ${className}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Star size={size} strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={favorited ? `Unpin ${slug}` : `Pin ${slug}`}
      title={favorited ? 'Pinned to favorites' : 'Pin to favorites'}
      onClick={(e) => toggleFavorite(slug, e)}
      className={`favorite-btn inline-flex items-center gap-1.5 p-1.5 rounded-lg transition-all ${
        favorited
          ? 'text-amber-500 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
          : 'text-text-dim/60 hover:text-amber-500 hover:bg-muted/60'
      } ${className}`}
    >
      <Star
        size={size}
        className={`transition-transform duration-200 ${favorited ? 'fill-amber-500 dark:fill-amber-400 scale-110' : 'hover:scale-105'}`}
        strokeWidth={favorited ? 2 : 1.8}
      />
      {showLabel && (
        <span className="text-xs font-medium">
          {favorited ? 'Pinned' : 'Pin tool'}
        </span>
      )}
    </button>
  );
}
