/**
 * ADD A TOOL IN TWO STEPS:
 * 1. Create app/tools/<slug>/page.tsx. Keep its components and logic in that folder.
 *    Add 'use client' only to components that need browser APIs or interactive state.
 * 2. Add its metadata below. The home grid and sidebar update automatically.
 * Use shared CSS variables / Tailwind tokens; never hardcode tool colors.
 * Import any Lucide icon here for the new entry. Slugs must be unique.
 */
import { CalendarDays, Gauge, ImageDown, type LucideIcon } from 'lucide-react';
export interface Tool { slug: string; name: string; description: string; icon: LucideIcon; category: string }
export const tools: Tool[] = [
  { slug: 'speed-test', name: 'Speed test', description: 'Get a clear picture of your connection. Check your download, upload, and ping in seconds.', icon: Gauge, category: 'Network' },
  { slug: 'photo-compressor', name: 'Photo Compressor', description: 'Make images smaller with a target file size. Preview the result before you download.', icon: ImageDown, category: 'Images' },
  { slug: 'date-converter', name: 'Date Converter', description: 'Move between Nepali and English dates. Convert Bikram Sambat and Gregorian dates in either direction.', icon: CalendarDays, category: 'Utilities' },
];
