import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { bg:'var(--bg)',panel:'var(--panel)',border:'var(--border)',text:'var(--text)',dim:'var(--text-dim)',accent:'var(--accent)' }, borderRadius: { panel:'var(--radius)' } } }, plugins: [] } satisfies Config;
