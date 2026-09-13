# Task 05 — FilterBar

**Depends on:** 04. **Read:** MASTER.md §6 (Filtering); DESIGN.md §§8.3, 5, 9.

## Goal

The filter controls and the filter-state object. **Presentation and state only** — real matching logic arrives in task 15. Until then filtering is a plain case-insensitive substring test over film titles and the names, regions, and addresses of cinemas showing each film.

## Files

Create: `src/lib/components/FilterBar.svelte`, `src/lib/filterState.ts`, `src/lib/components/FilterBar.test.ts`.
Modify: `src/routes/+page.svelte`.

## Steps

1. **`filterState.ts`** — export exactly:
   ```ts
   export type Filters = {
     query: string;
     region: string | null;
     cinema: CinemaId | null;
     type: CinemaType | null;
     tonight: boolean;
     day: string | null;   // ISO date; null = all days
   };
   export const emptyFilters: Filters;
   export function filtersToSearchParams(f: Filters, defaults?: Partial<Filters>): URLSearchParams;
   export function filtersFromSearchParams(p: URLSearchParams, defaults?: Partial<Filters>): Filters;
   ```
   URL parameter names, exactly: `q`, `region`, `cinema`, `type`, `tonight`, `day`. Merge `defaults` over `emptyFilters`, and omit any key equal to that effective default so a clean view has a clean URL. The functions must round-trip when called with the same defaults: `filtersFromSearchParams(filtersToSearchParams(f, defaults), defaults)` deep-equals `f`.
2. **`FilterBar.svelte`** — props: `filters: Filters`, `cinemas: Cinema[]`, `onChange: (f: Filters) => void`.
   - Sticky container per DESIGN.md §8.3, with an **opaque** `--bg` background.
   - Search `<input type="search">`, full width, **`font-size: 16px`** (iOS zoom), `aria-label` from `strings.ts`.
   - Chip row, horizontally scrollable on mobile per DESIGN.md §8.3: one "Απόψε" toggle chip, then one chip per `CinemaType` (labels are the type values themselves), then an "Όλα" chip that clears the type filter. Chips are `<button type="button">` with `aria-pressed`.
   - Render one stable desktop-controls wrapper containing the region and cinema `<select>` elements in SSR at every viewport; hide the wrapper below 900px with a mobile-first CSS media query and show it at **≥900px**. `display: none` keeps the mobile controls out of the focus and accessibility trees. Do not branch markup on `window.innerWidth`. Populate region options from the distinct `cinemas[].region`, sorted with `localeCompare(…, 'el')`. Implement cascading behaviour: choosing a region narrows the cinema list to that region; choosing a cinema sets the region to that cinema's region. Each `<select>` gets a visually-hidden `<label>`.
   - Every interaction calls `onChange` with a **new** `Filters` object. The component holds no state of its own.
3. **`+page.svelte`** — hold `filters` in `$state`. Derive the visible list with a `$derived` that applies the temporary substring test to `titleEl`, `titleEn`, and the `name`, `region`, and `address` of cinemas showing the film, plus the region/cinema/type filters. Mirror filters to the URL with `replaceState` (never `pushState` — typing must not fill the history stack), and initialise from `page.url.searchParams` on load. Wire the empty state's clear button to `emptyFilters`.
4. **`FilterBar.test.ts`** — assert: typing calls `onChange` with the new query; clicking a type chip sets `type` and `aria-pressed="true"`; clicking "Όλα" clears it; the "Απόψε" chip toggles `tonight`; `filtersToSearchParams` / `filtersFromSearchParams` round-trip for fully-populated and empty filters with and without explicit defaults; the desktop wrapper is present in SSR markup, hidden and non-focusable below 900px, and visible with keyboard-reachable selects at 900px and above.

## Acceptance criteria

- [ ] `npm test` and `npm run check` pass.
- [ ] Typing filters the grid with no network request (verify the Network tab stays empty).
- [ ] The URL updates as filters change; reloading restores the same filtered view; Back does not step through every keystroke.
- [ ] At 360px: search plus a horizontally scrolling chip row, no dropdowns.
- [ ] At 1280px: search plus chips plus both dropdowns, cascading correctly.
- [ ] The sticky bar is opaque over scrolling posters in both themes.
- [ ] Selected chips use `--accent-sunk` background with `--accent` text — **not** a solid accent fill.

## Do not

- Do not implement greeklish or fuzzy matching here — task 15 owns it.
- Do not use `backdrop-filter`.
- Do not use `pushState`.
- Do not debounce. Filtering is synchronous and instant; a debounce adds the latency this project exists to avoid.
- Do not use viewport-dependent conditional markup for the dropdowns; static SSR markup plus the 900px CSS media query is mandatory.
