# Toolbox

A Next.js 14 App Router + TypeScript + Tailwind CSS hub for independent tools.

## Run locally

Use Node.js 20 or newer and npm:

```sh
npm install
npm run dev
```

Open http://localhost:3000. `npm run build` creates a production build;
`npm start` serves it. `npm run typecheck` checks TypeScript and `npm test`
runs the measurement and storage tests. A pnpm lockfile is also included for
this workspace's bundled pnpm runtime (`pnpm install --frozen-lockfile`).

## Structure

```text
app/
  layout.tsx                 Shared shell, Inter font, theme provider
  globals.css                Light/dark tokens and responsive styling
  page.tsx                   Registry-generated tool grid
  tools/speed-test/
    page.tsx                 Route metadata and entry point
    speed-test.tsx           Isolated React client UI and local history
    measure.ts               Abortable Cloudflare measurements
components/
  providers.tsx              Persistent next-themes provider
  shell.tsx                  Registry-generated navigation and theme toggle
lib/
  tools-registry.ts          Single source of tool metadata
  storage.ts                 Async, tool-scoped storage adapter
  auth.ts                    Future session contract; returns null today
tests/                      Measurement and storage checks
```

## Add a tool in two steps

1. Create `app/tools/photo-compressor/page.tsx` (or another unique slug).
   Keep its UI components, hooks, and logic in that folder. Components using
   state or browser APIs need `'use client'`. A server page can wrap the client
   component and export Next.js metadata, as the speed test does.
2. Import a Lucide icon in `lib/tools-registry.ts` and add an entry:

```ts
{ slug: 'photo-compressor', name: 'Photo compressor',
  description: 'Make photos smaller before sharing.',
  icon: ImageDown, category: 'Images' }
```

The home grid and desktop/mobile navigation update automatically. No route map
or shared layout edits are needed. Each tool owns its state; navigation away
unmounts it. The shared layout uses Next.js Link navigation.

## Change the theme

Edit the `:root` and `[data-theme="dark"]` blocks at the top of
`app/globals.css`. Required tokens are `--bg`, `--panel`, `--border`, `--text`,
`--text-dim`, `--accent`, and `--radius`. Additional shared tokens are
`--accent-soft`, `--accent-contrast`, and `--muted`.

Tailwind aliases live in `tailwind.config.ts`: use `bg-panel`, `text-text`,
`text-dim`, `border-border`, `text-accent`, and `rounded-panel`. SVG charts
use the same CSS variables. Never put tool-specific color literals in a tool.

The header toggle persists `toolbox-theme` in localStorage. The first visit
uses light mode regardless of the operating system. next-themes sets the attribute before rendering
to avoid a theme flash. Inter is loaded with `next/font/google`, which needs
network access during the initial development/production compilation.

## Speed test

The pasted tool was migrated to React. It makes six zero-byte HTTP requests
and reports median latency, streams 25 MB download requests for roughly six
seconds, then posts 4 MiB payloads for roughly five seconds. Upload duration
includes completion of the final request. Requests use Cloudflare's public
`https://speed.cloudflare.com/__down` and `/__up` endpoints directly from the
browser, with no server proxy. HTTP errors, network failures, and stalled
requests produce an error message; Cancel or leaving the page aborts work.

These are approximate browser throughput and HTTP latency measurements, not
ICMP ping or a full reproduction of Cloudflare's own test algorithm. Other
traffic, VPNs, server load, and browser overhead affect results. A test can
use substantial bandwidth on fast connections; it starts only on a click.
Networks or preview environments blocking Cloudflare may prevent live tests.

## Photo Compressor

`app/tools/photo-compressor/page.tsx` exports metadata and renders the client UI
in `photo-compressor.tsx`. `compress.ts` contains the browser-only image helpers;
it has no React or storage dependencies. Its parsing/formatting helpers are pure,
while decoding and Canvas encoding necessarily use browser APIs.

Choose JPG, PNG, WebP, GIF, or BMP and enter a decimal KB/MB target. File signatures
are checked before decoding, so renamed PDFs are rejected. All processing stays
on the device. GIF and other animated formats become a single still frame.

JPEG/WebP output uses up to ten quality probes at each resolution, aiming within
5% of the requested byte size. If quality alone cannot approach the target,
up to eight resolution levels are tried, with a quality warning. Exact output
sizes cannot be guaranteed. PNG keeps its dimensions and lossless encoding;
enable WebP conversion for smaller targets. Re-encoding may remove metadata.
Targets at or above the original size skip compression. The original is also
kept if re-encoding offers no size reduction. Canvas work is capped at 40 MP
and 16,384 pixels per side to avoid unreliable large allocations.

## Storage and future accounts

The most recent five complete speed tests are stored on this device. Tools
use `await storage.get<T>(slug, key)` / `storage.set(slug, key, value)` /
`storage.remove(slug, key)`. Keys are namespaced by tool and schema version.
Malformed history is ignored; unavailable storage does not fail a speed test.
Use the adapter from browser effects/events only.

Replace the `ToolStorage` implementation with authenticated HTTP calls when
a database is added. Keep its async contract to preserve tool call sites.
`lib/auth.ts` defines a future user/session boundary but implements no login,
account controls, or security enforcement. Implement backend authentication
and user ownership checks before storing account-linked history. Theme
preferences should remain device-local.

## Framework version

Next.js 14.2.35 is pinned to honor the requested version. Next.js 14 is outside
the currently patched release lines; upgrade before public production hosting.
See the [official security release](https://vercel.com/changelog/next-js-may-2026-security-release).
This deliverable is a local development app; it has not been deployed.
