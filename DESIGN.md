# DESIGN.md — Calcine presentation layer

Companion to [MASTER.md](./MASTER.md). **This document is the source of truth for every visual decision.** No builder should invent a colour, size, radius, or duration. If a value is needed and not defined here, that is a gap to report, not a gap to fill.

---

## 1. Principles

1. **The posters are the interface.** 90 pieces of saturated artwork carry all the colour. Chrome must recede to near-neutral or it competes with them.
2. **Mobile-first, literally.** Author base styles for a 360px viewport. Every `@media` query is `min-width`. No desktop-first overrides.
3. **Nothing moves that the user did not move.** No entrance animations, no skeleton shimmer, no layout-shifting transitions. This is the project thesis (MASTER §3), expressed in CSS.
4. **Elegance is restraint.** One accent, one shadow, one radius scale, one font. Every additional variant needs a reason.

### Reference points

Study these for *restraint*, not for copying: **Letterboxd** (poster grid density, muted chrome), **MUBI** (typographic minimalism, generous whitespace), **Criterion Channel** (warm neutrals under artwork), **Are.na** (grid discipline, near-invisible UI).

### Explicitly forbidden

These are the signatures of generated-looking interfaces. None may appear:

- **Purple/violet/indigo accents** (`#6366F1`, `#8B5CF6` and neighbours) — the single strongest tell.
- **Gradients on surfaces, buttons, headers, or text.** No `linear-gradient` except the one bottom-sheet scrim defined in §8.4.
- **Neon or fully saturated accents.** Every accent in this document sits below 45% saturation.
- **Glassmorphism** — no `backdrop-filter: blur()`.
- **More than one shadow level.** No glows, no coloured shadows, no `box-shadow` on tiles at rest.
- **Emoji as interface icons.**
- **Border radius above 12px** on anything except the bottom sheet and pill-shaped chips.
- **Animated borders, shimmer, pulse, or any `infinite` animation.**
- **Multiple accent hues.** There is exactly one.
- **Centred body text**, letter-spaced body copy, or all-caps runs longer than two words.

---

## 2. Colour tokens

Defined once in `src/lib/styles/tokens.css`. **Components reference tokens only — no literal hex values anywhere else in the codebase.**

### Light (default)

```css
:root {
  --bg:            #FBFBFA;  /* page */
  --surface:       #FFFFFF;  /* cards, sheets, dropdowns */
  --surface-sunk:  #F4F4F2;  /* input fields, unselected chips */
  --border:        #E4E3DF;  /* hairlines */
  --border-strong: #C9C8C3;  /* focused input */
  --text:          #1A1A18;  /* primary */
  --text-muted:    #6B6B66;  /* secondary, metadata */
  --text-faint:    #93928C;  /* tertiary, disabled */
  --accent:        #2C4A63;  /* ink navy — links, selected, focus */
  --accent-hover:  #22394D;
  --accent-sunk:   #EAEEF2;  /* selected chip background */
  --warn-bg:       #FBF3E4;  /* staleness banner */
  --warn-border:   #E6D4AE;
  --warn-text:     #6B5320;
  --scrim:         rgb(26 26 24 / 0.32);
}
```

### Dark

```css
[data-theme='dark'] {
  --bg:            #141413;
  --surface:       #1D1D1B;
  --surface-sunk:  #262624;
  --border:        #302F2C;
  --border-strong: #45443F;
  --text:          #EDEDEA;
  --text-muted:    #A3A29C;
  --text-faint:    #76756F;
  --accent:        #8FB0C9;
  --accent-hover:  #A8C3D7;
  --accent-sunk:   #22303A;
  --warn-bg:       #2A2415;
  --warn-border:   #4A3F22;
  --warn-text:     #D9C48C;
  --scrim:         rgb(0 0 0 / 0.55);
}
```

### Rules

- Dark is **not** pure black: `#000` makes dark poster edges dissolve into the page.
- Light is **not** pure white: `#FFF` glares against saturated artwork.
- Both palettes are **warm-neutral** (red channel highest). Do not mix in cool greys.
- The accent appears **only** in: links, focus rings, selected chips/options, and the active day. Never as a large fill.
- **Contrast floors:** body text ≥ 7:1, muted text ≥ 4.5:1, focus ring ≥ 3:1 against adjacent colour. Verify both themes before marking any UI task complete.

---

## 3. Typography

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;  /* showtimes only */
```

**No web fonts.** A downloaded font swaps and reflows, which is the exact flicker this project exists to prevent, and it is an external request on a page designed to make none. System stacks render Greek correctly on iOS, Android, macOS and Windows.

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `--text-xs` | 12px / 1.4 | 500 | metadata, chip labels |
| `--text-sm` | 13px / 1.45 | 400 | secondary copy, times |
| `--text-base` | 15px / 1.55 | 400 | body |
| `--text-lg` | 17px / 1.4 | 600 | film title in panel |
| `--text-xl` | 22px / 1.3 | 600 | page heading |

- Weights permitted: **400, 500, 600**. No 700+, no 300 or lighter.
- `letter-spacing: -0.011em` on `--text-lg` and `--text-xl` only.
- **Showtimes use `--font-mono`** with `font-variant-numeric: tabular-nums`, so time columns align.
- Greek titles are long: film titles in tiles clamp to 2 lines via `-webkit-line-clamp: 2`.

---

## 4. Space, radius, elevation, motion

```css
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
--space-5: 24px;  --space-6: 32px;  --space-7: 48px;

--radius-sm: 4px;   /* chips, inputs */
--radius-md: 8px;   /* posters, cards */
--radius-lg: 12px;  /* bottom sheet top corners */
--radius-pill: 999px;

--shadow: 0 1px 2px rgb(0 0 0 / 0.04), 0 4px 12px rgb(0 0 0 / 0.06);

--dur-fast: 120ms;
--dur-base: 200ms;
--ease: cubic-bezier(0.2, 0, 0.2, 1);
```

- **`--shadow` is the only shadow in the system.** It is permitted on exactly two elements: the bottom sheet and the desktop dropdown. Tiles never carry a shadow.
- Depth elsewhere comes from `--border` hairlines, not elevation.
- **Transitions are permitted only on `opacity`, `transform`, `background-color`, `border-color`, `color`.** Never on `width`, `height`, `top`, `left`, or `margin` — those trigger layout.
- Every transition must be wrapped:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. Breakpoints

```css
/* base: 360px+ — author here first */
--bp-sm:  640px;   /* large phone / small tablet */
--bp-md:  900px;   /* tablet landscape; desktop controls appear */
--bp-lg:  1200px;  /* desktop; max container width */
```

Container: full-bleed with `--space-4` padding to 900px; `max-width: 1200px` and centred above.

**900px is the behavioural breakpoint** — below it the UI is search-primary with a bottom sheet; at and above it the region/cinema dropdowns appear and the panel expands in place (MASTER §6).

---

## 6. Theme switching

**Light is the default.** Dark is opt-in via toggle. A first-time visitor whose OS is set to dark gets dark; the toggle overrides and persists.

### Mechanism

- State lives as `data-theme="light" | "dark"` on `<html>`.
- Persisted to `localStorage` under key `calcine-theme`.
- Resolution order: stored value → `prefers-color-scheme` → light.

### No-flash requirement

The theme must be applied **before first paint**. Put this inline in `src/app.html` inside `<head>`, before any stylesheet. It must not be a module, deferred, or imported — an async script produces a white flash on dark-theme load, which is precisely the flicker this project forbids.

```html
<script>
  (function () {
    try {
      var s = localStorage.getItem('calcine-theme');
      var t = s || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', t);
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();
</script>
```

Also set `<meta name="color-scheme" content="light dark">` so form controls and scrollbars follow the theme.

### Toggle control

- Position: top-right of the header.
- 20×20px icon inside a **minimum 44×44px hit area**; use padding rather than fixing the button to 40×40px.
- Icon: inline SVG sun/moon, `stroke: currentColor`, 1.5px stroke, 20px box. **No emoji.**
- `aria-label`: `"Εναλλαγή σε σκοτεινό θέμα"` / `"Εναλλαγή σε φωτεινό θέμα"`, switching with state.
- The icon may cross-fade on `opacity` over `--dur-fast`. Colours themselves switch instantly — animating a whole-page colour change looks cheap and costs a paint on every element.

---

## 7. Focus and interaction

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

- **Never `outline: none` without a `:focus-visible` replacement.**
- Minimum touch target 44×44px, enforced with padding, not with size.
- Hover effects apply only under `@media (hover: hover)` so they do not stick on touch.
- Tile hover: `opacity: 0.88` on the poster. No scale, no lift, no shadow — transform on a grid item is a repaint risk and scale blurs poster text.

---

## 8. Component specifications

### 8.1 Grid

```css
display: grid;
gap: var(--space-3);
grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
```

| Breakpoint | `minmax` | gap |
|---|---|---|
| base | 110px | `--space-3` |
| ≥ 640px | 140px | `--space-4` |
| ≥ 900px | 160px | `--space-4` |

### 8.2 Film tile

- Root element is a **`<button>`**, not a div (MASTER §6 a11y baseline). Reset: `background: none; border: 0; padding: 0; text-align: left; font: inherit; color: inherit;`
- Poster wrapper: `aspect-ratio: 2/3`, `border-radius: var(--radius-md)`, `overflow: hidden`, `background: var(--surface-sunk)`.
- `<img>`: explicit `width`/`height` attributes, `width: 100%; height: 100%; object-fit: cover; display: block`.
- First 6 tiles: `fetchpriority="high"`, no `loading` attribute. Remaining: `loading="lazy" decoding="async"`.
- Title below poster: `--text-xs`, `--text` colour, 2-line clamp, `margin-top: var(--space-2)`.
- Expanded state: `aria-expanded`, and a 2px `--accent` left border on the title row. No colour fill.

### 8.3 Filter bar

- **Sticky** at top under the header: `position: sticky; top: 0; z-index: 10; background: var(--bg);` with a `--border` bottom hairline. Must have an opaque background — a transparent sticky bar over scrolling posters is unreadable.
- Search input: full width, `--surface-sunk` background, 1px `--border`, `--radius-sm`, `--space-3` padding, 16px font size (**iOS zooms the page on focus below 16px**).
- Filter chips (type, tonight): pill-shaped, `--surface-sunk` background, `--text-muted` label. Selected: `--accent-sunk` background, `--accent` text, 1px `--accent` border. **Never a solid accent fill.**
- Chips scroll horizontally on mobile: `overflow-x: auto; scrollbar-width: none;` with `--space-4` end padding.
- Desktop (≥900px) only: region and cinema `<select>` elements, styled with `--surface` background and `--border`, appearing inline beside the search box. Keep their wrapper in the static SSR markup and hide it below 900px with CSS; `display: none` keeps hidden controls out of the focus and accessibility trees without hydration-driven layout changes.

### 8.4 Cinema panel

**Below 900px — bottom sheet:**
- `position: fixed; inset-inline: 0; bottom: 0; max-height: 85dvh; overflow-y: auto;`
- `background: var(--surface)`, `border-radius: var(--radius-lg) var(--radius-lg) 0 0`, `--shadow`.
- Scrim behind: `background: var(--scrim)`, fades in over `--dur-base`.
- Sheet enters with `transform: translateY(100%)` → `translateY(0)` over `--dur-base` — transform only, never `bottom` or `height`.
- Drag handle: 36×4px, `--border-strong`, `--radius-pill`, centred, `--space-3` margin.
- Close on: scrim tap, `Esc`, and an explicit close button. `body` gets `overflow: hidden` while open; `scrollbar-gutter: stable` on the page prevents scrollbar removal from shifting desktop content.

**At 900px and above — in-place panel:**
- Expands inside the grid as a full-row item (`grid-column: 1 / -1`), `--surface` background, 1px `--border`, `--radius-md`.
- No scrim, no transform animation, no body scroll lock.

**Contents (both):** film title (`--text-lg`), then cinemas grouped by neighbourhood. Neighbourhood heading `--text-xs`, `--text-faint`, uppercase. Cinema name `--text-base`. Times as `--font-mono` `--text-sm` pills wrapping in a flex row, `--space-2` gap. Dubbed times carry a `ΜΕΤΑΓΛ.` label in `--text-xs` `--text-muted` — never colour-coded, since colour alone is not an accessible signal.

### 8.5 Staleness banner

- Full-width strip below the header. `--warn-bg`, 1px `--warn-border` bottom, `--warn-text`, `--text-sm`, `--space-3` padding.
- Non-blocking, not dismissible, never covers content.
- Copy states the date explicitly: `Τα προγράμματα ενημερώθηκαν στις {date}. Ενδέχεται να μην είναι επίκαιρα.`

### 8.6 Empty state

Centred in the grid area, `--space-7` vertical padding: `--text-base` `--text-muted` message plus a "clear filters" text button in `--accent`. No illustration, no icon.

### 8.7 Header and footer

- Header: site name in `--text-xl` on the left, theme toggle on the right, `--space-4` padding, `--border` bottom hairline. Not sticky (the filter bar is).
- Footer: `--text-xs`, `--text-faint`, `--space-6` top margin. Contains the flix.gr attribution linkback and the TMDB logo plus prescribed notice (MASTER §11). Links use `--accent`.

---

## 9. Language

**The interface is in Greek.** Data is Greek; users are in Athens. Search must accept Greek, greeklish and English input (MASTER §6), but labels, buttons and messages are Greek. No i18n framework — strings live in `src/lib/strings.ts` as a flat exported object so they are greppable and translatable later.

---

## 10. Definition of done for any UI task

A UI task is complete only when all of these hold:

1. Renders correctly at **360px, 640px, 900px, 1280px**.
2. Correct in **both themes**, verified by toggling — no hardcoded hex outside `tokens.css`.
3. **No flash** on reload in dark theme.
4. Fully operable by **keyboard**; visible `:focus-visible` ring everywhere.
5. **CLS contribution is zero** — verified in DevTools Performance.
6. Respects `prefers-reduced-motion`.
7. Contains **no value absent from this document**.
