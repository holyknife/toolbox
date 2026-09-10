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

Method `parallel-v3` runs entirely in the browser against Cloudflare's public
`/__down` and `/__up` endpoints. No extra package or result telemetry is added.

- **Ping:** discard one setup request and take ten zero-body HTTP probes. The
  headline is the median; the mean and jitter are also shown. When cross-origin
  Resource Timing is exposed, `responseStart - requestStart` excludes DNS/TCP/TLS
  setup. Otherwise the UI labels the warmed HTTP elapsed-time fallback. Server
  processing still contributes; this is not ICMP or game-server ping. A 370 ms
  result is not automatically wrong and is never artificially clamped.
- **Throughput:** four concurrent adaptive request streams warm for at least two
  seconds before any scored traffic. Three windows of at least four seconds each
  use total acknowledged bytes / shared elapsed wall time. Final speed is their
  median and the range shows variation. The final requests finish before scoring;
  no partial request or warm-up bytes inflate results. HTTP/2/3 may multiplex the
  streams; JavaScript cannot force four distinct TCP connections.
- **Live display:** downloaded chunks and XHR upload-progress events update the
  gauge. Upload progress is provisional until the server acknowledges it. The
  needle/number interpolate real values, respect reduced motion, and have no
  influence on the final arithmetic. The arc caps visually at 300; numbers do not.
- **Pause/retry:** hiding the tab cancels traffic for the current phase, shows a
  paused state, and waits without sending traffic. Returning automatically warms
  and restarts that phase; completed phases remain. Losing window focus alone
  does not pause it. Each failed phase retries once, then records its error and
  continues to the next phase. Partial/manual-stop results stay visible but do
  not enter completed history. Navigation away still stops the test.
- **Interpretation/history:** activity guidance is a labelled rule of thumb with
  visible thresholds, not a guarantee. No packet loss is measured. The last five
  complete results remain local. Three or more show a chronological sparkline;
  older methodologies are labelled to avoid misleading comparisons.

Files: `network.ts` owns HTTP/XHR progress and timing; `session.ts` owns pause and
retry; `measure.ts` aggregates samples; `speed-test.tsx` manages UI/history;
`speed-gauge.tsx` animates the readout; `result-insights.tsx` renders guidance and
trends. Gradient colors are theme variables in `app/globals.css`.

Research: [Cloudflare's reference engine](https://github.com/cloudflare/speedtest)
uses Resource Timing; [requestStart documentation](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceResourceTiming/requestStart)
explains timing exposure. This is a separate methodology, not a reproduction of
their engine. Wi-Fi, other traffic, the device and the server path affect results.
Tests usually take 30–60 seconds, longer with retries or slow connections, and
can consume hundreds of MB or more. Tests only start on a click.

## Preeti to Unicode

Open `/tools/preeti-to-unicode` or find it in the Language tools. Paste the
Preeti-encoded portions of a document into the source pane; Unicode appears in
the second pane. Copy it or download a UTF-8 `.txt` file. Source text stays intact.
Conversion is entirely local after the page loads: no conversion API, remote
font, added package, or text upload. This tool does not persist your text.

Preeti is a legacy glyph encoding, not phonetic Roman Nepali. For example,
`g]kfnL` represents `नेपाली`. Plain text loses the original font information,
so English and Preeti cannot be reliably distinguished automatically. Paste only
the Preeti sections of mixed-font documents. Existing Unicode Nepali and exact
spaces, tabs, and line breaks are preserved. This does not import Word formatting,
convert other legacy fonts, or perform OCR on scans. For `namaste`-style input,
use Nepali Typing instead.

Implementation files each have one job:

- `page.tsx`: server metadata and entry point.
- `preeti-converter.tsx`: source/result panes, review notices, copy and download.
- `preeti-map.ts`: legacy glyph positions.
- `convert.ts`: extension strokes, syllable ordering, vowel composition, diagnostics.

Research checked on September 10, 2026:

- [Unicode's Devanagari specification](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-12/)
  explains logical character order, virama, and rendering.
- [Shuvayatra/preeti](https://github.com/Shuvayatra/preeti) and
  [npttf2utf](https://github.com/casualsnek/npttf2utf) provide community mapping
  references. The conversion functions here are a separate implementation;
  neither project's engine is installed or bundled.
- [The dpr4dhan converter source](https://github.com/dpr4dhan/preeti-to-unicode)
  was also inspected. Package documentation and current source disagreed, so
  published claims of completeness were not treated as proof of correctness.

The converter moves visual short-i before a cluster into logical Unicode order,
moves trailing reph before the whole consonant cluster, handles extension strokes
such as `km` (फ), and combines legacy vowel pieces. Reordering is limited to
legacy runs and cannot cross whitespace, existing Unicode, or unknown characters.
Unsupported symbols and unattached strokes remain visible with a review notice.
It deliberately does not spell-check text or silently delete repeated vowel signs.
Published tables disagree about `¥`: if present, the UI offers rakaar (`्र`, the
npttf2utf default) or eyelash ra (`र्‍`, the Shuvayatra alternative). Compare with
the original document before choosing.

Validation: `tests/preeti.test.ts` covers known words, half forms, conjuncts,
short-i/reph placement, extension strokes, vowel ordering, digits, punctuation,
mixed Unicode, exact whitespace, unsupported input, and 10,000 repeated lines.
The implementation also matched all 48 published Shuvayatra examples when using
that reference's eyelash-ra choice. These checks do not guarantee recovery of
damaged PDF extraction, modified font encodings, or every possible legacy typo;
review names and unusual symbols against the source document.

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

### Nepali Typing

Files live in `app/tools/nepali-typing/`: `page.tsx` contains server metadata,
`nepali-typing.tsx` handles the textarea and browser actions, `transliterate.ts`
contains offline conversion/suggestions, and `word-suggestions.tsx` positions the inline chooser, and `editor-state.ts` holds pure editing
and draft-validation functions.

**No external transliteration service is used.** Sanscript is bundled with the
app and supplemented by a small, editable Nepali spelling list. Once the page
and its typing bundle have loaded, conversion and suggestions work without a
network connection. This is not an installable offline PWA: opening/reloading
the site from scratch still requires the app server or a cached page.
The dynamic package load has a visible retry action on failure.

Type Roman words and press Space, Enter, or punctuation to convert. Suggestions
appear while typing. Click a converted word or press Backspace immediately after
one to revisit its alternatives; another Backspace deletes normally. Suggestions float beside the edited word inside the textarea. Up/Down cycle
choices with the active row centered (two above and two below), Enter applies,
and Escape closes. Focus stays in the editor. Space after the selected word is
preserved so typing can continue immediately. The popup follows wrapping,
textarea scrolling, and resizing, and flips above the word when needed.
The optional spelling input remains available inside the popup.
Ctrl+G or the mode button toggles future typing between English and Nepali.
Existing text is preserved. Native IME composition is left alone.

This is a deterministic phonetic editor, **not a Google-quality predictive
dictionary**. Familiar spellings such as `dhanyabad`, `tapai`, and `ramro`
have local corrections; other words use ITRANS with final-schwa handling.
Alternatives include the spelling list, literal ITRANS forms, short/long vowels,
doubled consonants, and ya combinations. For example, `ma` offers म, मा, म्म, म्य,
and म्या. Up to 12 unique choices are shown, with the familiar default first.
These are possible spellings, not guaranteed dictionary words. “Try another
spelling” refreshes choices without changing the document until one is selected. For precision,
use aa/ii/uu, sh, and capital T/D/N. Add vocabulary in `commonWords` in
`transliterate.ts`. No application text-length limit is imposed; browser memory
and localStorage quota still apply. The character counter counts Unicode code
points (including combining marks and spaces); words are whitespace-separated.

Drafts are saved on every edit through `lib/storage.ts`, under the tool's own
namespace. Text, mode, and original Roman spellings are restored together, so
suggestions remain available after reload. The adapter's optional strict read
reports invalid JSON without changing the forgiving default for existing tools.
Invalid draft shapes, blocked/full storage, clipboard failures, and download
failures are shown in the UI. Copy/download remain available if saving fails.
Clear saves an empty draft.

Package comparison checked 2026-09-09 using npm's registry and downloads API.
Downloads cover 2026-08-31 through 2026-09-06; publication dates below refer to the
latest release, not metadata-only updates.

| Package | Latest version | Published | Weekly downloads | Approach |
| --- | --- | --- | --- | --- |
| @indic-transliteration/sanscript | 1.3.3 | 2025-06-08 | 5,752 | Bundled, offline |
| easy-typing-input-tool | 2.1.3 | 2025-04-03 | 6 | Wraps google-input-tool |
| google-input-tool | 1.4.3 | 2020-05-09 | 30 | External Google service |

Sanscript had the newer release and much broader usage of these candidates,
without depending on an unofficial remote input endpoint. Its latest release
is over a year old; this comparison does not imply frequent releases.
`roman-to-nepali` returned 404 from the npm registry during this check.

Sources: [Sanscript documentation](https://github.com/indic-transliteration/sanscript.js),
[Google wrapper source](https://github.com/sambhuWeb/google-input-tool),
[Easy Typing source](https://github.com/sambhuWeb/easytyping-google-input-tool),
[npm package metadata](https://registry.npmjs.org/@indic-transliteration%2fsanscript),
[npm download statistics](https://api.npmjs.org/downloads/point/2026-08-31:2026-09-06/@indic-transliteration%2fsanscript).

`tests/nepali-typing.test.ts` covers known conversions, local alternatives,
multiword paste/newlines, mixed-language editing, word-range adjustments,
Unicode counts, draft round trips, corrupt data, quota errors, and reset.

API follow-up checked 2026-09-09: no hosted service with a documented free,
unlimited guarantee was verified. [Google Input Tools](https://www.google.com/inputtools/help/languages.html)
supports Nepali, and [AI4Bharat IndicXlit](https://github.com/AI4Bharat/IndicXlit)
offers Nepali models and hosted interfaces, but neither source establishes such
a guarantee for this app. The expanded suggestions therefore remain entirely
local, with no API quota or transmitted text.

### Calculators and search

`/tools/calculators` starts with the basic calculator. Fourteen calculators are
ranked by approximate interaction/formula complexity: basic arithmetic, discount,
tip/splitter, GST/VAT, profit margin, simple interest, BMI, aspect ratio, date
difference, age, compound interest, loan/EMI, GPA, and grades.

Each calculator has a shareable route at `/tools/calculators/[calculator]`.
The shared Toolbox sidebar stays active on these nested routes. Search is
available on the home grid, the calculator hub, and each calculator page.
The home search includes calculator keywords such as EMI, BMI, and GPA.

The local registry `calculators-registry.ts` supplies ordering, descriptions,
fields, defaults, and calculation entry points. `calculate.ts` and `dates.ts`
contain pure formulas, separate from form rendering. Basic arithmetic and the
dynamic GPA/grade forms have dedicated client components. Add another calculator
by extending the registry (and adding a custom client form if needed); static
routes are generated from that registry. No backend or calculation API is used.

Conventions and limits:
- Basic arithmetic uses a parser, not eval, with operator precedence, parentheses,
  unary signs, and postfix percentages. 10% means 0.1. The display keeps up to
  12 significant digits; expressions accept up to 2,000 characters.
- Financial amounts are currency-neutral estimates displayed to two decimals.
  GST/VAT has three fields: rate, before-tax price, and after-tax price. Enter
  any two to fill the third; all three entered values are checked for consistency.
  The tax rate defaults to an editable 13%, not a claim about the applicable rate.
  Editing an input clears the previously calculated amount; clearing an input
  keeps the other two values so you can solve in another direction. New bill clears
  the prices and restores the editable 13% rate. A zero before-tax price cannot determine a missing rate.
- EMI is fixed-rate, monthly, fully amortizing principal and interest; zero interest
  divides principal by months. Fees, insurance, taxes, and lender rounding are excluded.
- Compound interest is a lump sum with selected periodic compounding, no deposits.
  Fractional years use the compound-growth exponent; no taxes or inflation adjustment.
- Tip splitting rounds each person's share upward to a cent.
- Margin and markup use different denominators. Markup at zero cost is undefined.
- GPA is credit-weighted on a configurable numeric scale; schools' letter-grade
  mappings are intentionally not assumed.
- Grade modes calculate a normalized weighted average, final coursework/exam grade,
  or the exam percentage and whole marks needed for a target. Impossible targets
  are explicitly identified. Assessment weights cannot exceed 100%.
- BMI supports kg/cm and lb/total inches, preserving measurements on unit changes.
  Adult categories follow CDC guidance for ages 20+, not children or pregnancy.
- Date/age arithmetic uses Gregorian civil dates in UTC. Elapsed days exclude the
  end date. Whole calendar months clamp anniversaries to month end; leap-day ages
  use February 28 in non-leap years. This is not a jurisdiction-specific legal age.
- Invalid/blank values, zero denominators, impossible dates, and numeric overflow
  are rejected with visible messages. Changing an input clears stale results.

Reference sources:
[CDC adult BMI categories](https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html),
[CFPB amortization explanation](https://www.consumerfinance.gov/ask-cfpb/what-is-amortization-and-how-could-it-affect-my-auto-loan-en-771/),
[Investor.gov compound interest calculator](https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator).

`tests/calculators.test.ts` checks every calculator, including zero interest,
amortization balance, inclusive-tax reversal, fractional splits, grade limits,
leap days, month ends, invalid expressions, and every registry default.
