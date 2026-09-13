# Task 06 — CinemaPanel

**Depends on:** 05. **Read:** MASTER.md §4.7 (hall merging), §6 (Expansion); DESIGN.md §§8.4, 7, 4.

## Goal

The expansion panel: a bottom sheet below 900px, an in-grid panel at 900px and above. Times merged across halls, full week shown, full focus management.

## Files

Create: `src/lib/components/CinemaPanel.svelte`, `src/lib/panelData.ts`, `src/lib/panelData.test.ts`, `src/lib/components/CinemaPanel.test.ts`.
Modify: `src/lib/components/FilmGrid.svelte`, `src/routes/+page.svelte`.

## Steps

1. **`panelData.ts`** — pure, no Svelte imports. Export exactly:
   ```ts
   export type TimeSlot = { time: string; dubbed: boolean; formats: string[] };
   export type CinemaDay = { date: string; slots: TimeSlot[] };
   export type CinemaEntry = { cinema: Cinema; days: CinemaDay[] };
   export type RegionGroup = { region: string; cinemas: CinemaEntry[] };
   export function buildPanelData(dataset: Dataset, filmId: FilmId): RegionGroup[];
   ```
   Rules, in order:
   - Take every `Showing` for `filmId`, **across all halls**.
   - **Merge halls**: union all `screenings` for the same `(cinemaId, date)`. Hall is a deduplication detail and is never displayed (MASTER.md §4.7).
   - Deduplicate identical `(time, dubbed)` pairs arising from the merge. When duplicate pairs carry different `formats`, union and de-duplicate every format, then sort the resulting array with `localeCompare(…, 'el')`; no format may be discarded.
   - Sort: regions by `localeCompare(…, 'el')`; cinemas within a region by name, same comparator; days ascending by date; slots ascending by time.
   - Show the **full week** present in the dataset, not only the selected day.
   - A cinema with no screenings for a date omits that `CinemaDay` entirely rather than emitting an empty one.
2. **`CinemaPanel.svelte`** — props: `film: Film`, `groups: RegionGroup[]`, `selectedDay: string | null`, `onClose: () => void`.
   - Layout for both breakpoints exactly per DESIGN.md §8.4.
   - Contents per DESIGN.md §8.4 "Contents": film title, then region heading, cinema name, then time pills in `--font-mono` with `font-variant-numeric: tabular-nums`.
   - A day matching `selectedDay` gets the highlight; other days render normally. **Never hide non-selected days.**
   - Dubbed slots carry the `ΜΕΤΑΓΛ.` text label from `strings.ts`. **Colour must not be the only signal.**
   - Focus management: on open, move focus to the panel container (`tabindex="-1"`); on close, return it to the originating tile. `Esc` closes. Below 900px, tapping the scrim closes, focus is trapped inside the sheet, all app-shell siblings outside the sheet host are `inert`, and `document.body` gets `overflow: hidden` while open. Restore `inert` and overflow on close, breakpoint change, and component destroy. `scrollbar-gutter: stable` from task 02 prevents a horizontal shift.
   - The film heading has id `panel-title-{film.id}`. Apply `role="dialog"`, `aria-modal="true"`, and `aria-labelledby="panel-title-{film.id}"` **below 900px only**; above it the panel is inline content and gets none of those modal attributes.
   - Sheet entry animates `transform` only, per DESIGN.md §8.4.
3. **`FilmGrid.svelte`** — keep the mobile sheet as a fixed sibling outside the grid; no portal library is needed. At ≥900px place the panel as a `grid-column: 1 / -1` child **after the complete row containing the expanded tile**. Use a `ResizeObserver` on the grid, read the computed `grid-template-columns` count, and derive the insertion index; recompute when the grid width changes. Do not insert directly after the selected tile and leave the remainder of its row empty.
4. **Tests** — `panelData.test.ts`: using `sampleDataset`, assert the 4-hall film yields **one** cinema entry with all times merged and sorted, no duplicates; assert duplicate slots union differing formats without loss; assert the mixed dubbed/subtitled case yields both slots on the same day with correct flags; assert region and cinema ordering uses Greek collation; assert an empty result for an unknown `filmId`. `CinemaPanel.test.ts`: below 900px assert the exact accessible dialog name, focus entry, Tab/Shift+Tab containment, background inertness, all restoration paths, and `Esc`; at 900px assert there are no dialog/modal attributes, scrim, inert background, or body lock. Add a grid test for row-end placement before and after a resize. Assert focus returns to the originating tile and the dubbed label renders as text.

## Acceptance criteria

- [ ] `npm test` and `npm run check` pass.
- [ ] Below 900px: sheet slides up from the bottom, scrim dims the page, body does not scroll behind it, all three close routes work.
- [ ] At 900px+: panel expands in place with no scrim and no body-scroll lock.
- [ ] The tapped tile is still on screen after the sheet closes.
- [ ] Times align in columns (tabular numerals).
- [ ] CLS during open and close is **0** — verify in DevTools.
- [ ] Keyboard only: open a tile, read the panel, close with `Esc`, and focus is back on that tile.

## Do not

- Do not animate `height`, `bottom`, `top`, or `max-height` — transform only.
- Do not display hall names.
- Do not hide days outside the selected day.
- Do not indicate dubbing with colour alone.
- Do not allow two panels open at once.
