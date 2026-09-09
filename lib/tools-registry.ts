/**
 * ADD A TOOL IN TWO STEPS:
 * 1. Create app/tools/<slug>/page.tsx. Keep its components and logic in that folder.
 *    Add 'use client' only to components that need browser APIs or interactive state.
 * 2. Add its metadata below. The home grid and sidebar update automatically.
 * Use shared CSS variables / Tailwind tokens; never hardcode tool colors.
 * Import any Lucide icon here for the new entry. Slugs must be unique.
 */
import { Languages, CalendarDays, Gauge, ImageDown, QrCode, type LucideIcon } from 'lucide-react';
export interface Tool { slug: string; name: string; description: string; icon: LucideIcon; category: string }
export const tools: Tool[] = [
  { slug: 'nepali-typing', name: 'Nepali Typing', description: 'Write Nepali using English letters. Choose spellings, copy your text, and keep a private draft.', icon: Languages, category: 'Language' },
  { slug: 'speed-test', name: 'Speed test', description: 'Get a clear picture of your connection. Check your download, upload, and ping in seconds.', icon: Gauge, category: 'Network' },
  { slug: 'photo-compressor', name: 'Photo Compressor', description: 'Make images smaller with a target file size. Preview the result before you download.', icon: ImageDown, category: 'Images' },
  { slug: 'date-converter', name: 'Date Converter', description: 'Move between Nepali and English dates. Convert Bikram Sambat and Gregorian dates in either direction.', icon: CalendarDays, category: 'Utilities' },
  { slug: 'qr-generator', name: 'QR Code Generator', description: 'Turn links, WiFi details, and more into scannable codes. Create one or a whole batch.', icon: QrCode, category: 'Utilities' },
];
