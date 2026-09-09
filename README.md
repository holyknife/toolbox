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

## BS ↔ AD Date Converter

`app/tools/date-converter/page.tsx` wraps the client UI in `date-converter.tsx`.
`components/WheelPicker.tsx` contains the reusable drag/swipe/keyboard picker. `convert.ts` keeps date
math and formatting independent of React. There is one wheel interface, with
BS-to-AD and AD-to-BS direction buttons, Nepal-local Today, and Copy result.
Changing direction preserves the selected day. Month changes clamp invalid days.

`WheelPicker` accepts `label`, a numeric `value`, an array of `{ value, label }`
options, and `onChange`. Mouse and touch share Pointer Events with capture.
Release velocity projects the next row, then requestAnimationFrame applies a
cubic ease-out to land on its exact center. Only transforms and opacity change
during frames; React receives the selected value once motion settles. Resizing
remeasures row height. External value/option updates cancel stale animations.
Reduced-motion preferences disable momentum and snap immediately on release.

Browser checks covered desktop mouse drag/inertia and clicking a neighboring
month, plus a 390×844 phone viewport in both themes. The fixture in
`tests/wheel-browser-fixture.tsx` exercised simulated touch pointer gestures,
cancellation, independent columns, shorter-month clamping, exact centering,
and reduced-motion snapping. This is browser simulation, not physical iPhone
or mobile Safari validation. The fixture can be mounted on a temporary dev-only
route for reruns; no test route is included in the app.

The data is bundled from
[`@sonill/nepali-dates@1.0.7`](https://cdn.jsdelivr.net/npm/@sonill/nepali-dates@1.0.7/data/calendar-data.json),
the same source used in the supplied reference. Its MIT license is retained as
`calendar-data.LICENSE` beside `calendar-data.json`. No new runtime dependency,
remote script, calendar API request, or user date upload is needed.

Conversions use BS 2000-01-01 = AD 1943-04-14 as the anchor and UTC day arithmetic.
The supported range covers all bundled BS years 2000–2100; exact Gregorian bounds
are derived from the table and displayed in the tool. We do not extrapolate
missing years. Accuracy follows the community dataset, including future years.
To update data, replace it with a reviewed version from the same source, retain
the license, and rerun the reference-pair and full-range round-trip tests.

## QR Code Generator

`app/tools/qr-generator/page.tsx` is the server entry; `qr-generator.tsx` owns
client state and orchestrates generation. `qr-types.ts` defines the content
types, `qr-builder.ts` creates the payloads, `qr-input-fields.tsx` renders the
forms, `qr-renderer.ts` produces PNGs, and `qr-downloads.ts` packages ZIPs.

Supported payloads: text/URL, standard WiFi join strings, vCard 3.0 contacts,
mailto email, and tel phone numbers. Scanners offer the corresponding action;
the user still confirms joining, saving contacts, sending email, or calling.
WiFi reserved characters and vCard text are escaped; URI fields are encoded.
Single downloads and batches share the same rendering function. Batch text
means one text/URL per nonblank line. Each QR is capped at 2,000 UTF-8 bytes and
each generation at 100 entries. PNG sizes are 256, 512, 1024, and 2048 pixels.

The actively maintained [`qr` encoder](https://github.com/paulmillr/qr) is pinned
to 0.7.0. Only its encoding entry is shipped; no camera/decoder API is used by
the app. Tests import its decoder to verify all five payload types. Rendering
uses medium error correction, a four-module quiet zone, integer pixels, and
at least three pixels per module. Dense codes require a larger output size.
Any foreground/background color combination is allowed. Shared `--qr-ink` and
`--qr-paper` defaults live in `app/globals.css` and stay dark-on-light in both
UI themes. No logo or decorative QR modifications are supported.

[`JSZip`](https://github.com/Stuk/jszip) loads only when creating the ZIP. Images
use unique numbered filenames so duplicate SSIDs cannot overwrite each other.
All input, passwords, previews, and generated files stay in browser memory;
nothing is uploaded or saved to localStorage. Object URLs are released on
replacement and unmount. Anyone holding a WiFi QR can read its credentials.

### MIUI WiFi .bak compatibility

`miui-bak-parser.ts` is based on community reverse-engineering, **not an official
Xiaomi spec**. It supports the documented five-line MIUI v2 wrapper, unencrypted
Android backup versions 1–5 (uncompressed or zlib-compressed TAR), regular WiFi
TAR members, and plain exported WiFi configuration text. Recognized payloads
include MIUI settings `miui_bak/_tmp_bak` network blocks with Android-named
fields (`SSID`, `PreSharedKey`, `AllowedKeyMgmt`), `wpa_supplicant`
network blocks, `WifiBackupData` XML, and
`WifiConfigStoreData` XML. WPA/WPA2 Personal, WEP, and explicitly open networks
are accepted when required credentials validate. Raw hashed PSKs, encrypted or
masked passwords, enterprise/WPA3-only security, unknown binary formats, and
unfamiliar header versions are not recovered or guessed.

Files are limited to 20 MB compressed / 40 MB expanded and 500 parsed networks;
select up to 100 for each batch. TAR checksums and lengths, XML structure, SSIDs,
and credentials are checked. Invalid individual records produce a warning;
unreadable backups show a manual-WiFi fallback. The review list displays SSIDs
and security types, with selection checkboxes, **before** generating any QR.

Automated compatibility tests use synthetic fixtures of these known structures.
The MIUI settings layout was also verified locally against a user-provided backup;
no real credentials are stored in the repository. This does not cover every MIUI/HyperOS release. Some versions use other binary
settings payloads and will show an unsupported-format error.

Research sources:

- [MIUI wrapper reverse-engineering](https://github.com/nelenkov/android-backup-extractor/pull/79)
- [Android backup headers and zlib/TAR](https://github.com/nelenkov/android-backup-extractor)
- [Android WiFi backup structures](https://android.googlesource.com/platform/packages/modules/Wifi/+/434811d2c3/service/java/com/android/server/wifi/WifiBackupRestore.java)
- [WiFi and contact QR conventions](https://github.com/zxing/zxing/wiki/Barcode-Contents)

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
