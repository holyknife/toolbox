import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Shell } from '@/components/shell';
import './globals.css';
const inter = Inter({ subsets: ['latin'], display: 'swap' });
export const metadata: Metadata = { title: { default: 'Toolbox — Everyday tools, one place', template: '%s | Toolbox' }, description: 'A quiet workspace for useful everyday web tools. Start with a fast, simple connection speed test.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en" suppressHydrationWarning><body className={inter.className}><Providers><Shell>{children}</Shell></Providers></body></html>; }
