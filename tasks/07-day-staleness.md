# Task 07 — DaySelector and StalenessBanner

**Depends on:** 06. **Read:** MASTER.md §4.1, §4.4 (last paragraph), §6 (Day selector); DESIGN.md §8.5.

## Goal

Day selection driven entirely by the absolute dates present in the dataset, and an honest staleness notice.

## Files

Create: `src/lib/dates.ts`, `src/lib/components/DaySelector.svelte`, `src/lib/components/StalenessBanner.svelte`, `src/lib/dates.test.ts`.
Modify: `src/routes/+page.svelte`, `src/lib/components/FilterBar.svelte`, `src/lib/strings.ts` only if the task-03 day/month arrays require correction.

## Steps

1. **`dates.ts`** — pure, no Svelte imports. Every clock-dependent function takes `now: Date` explicitly; **never call `new Date()` inside**, so tests are deterministic. Export exactly:
   ```ts
   export function datesInDataset(d: Dataset, now: Date): string[]; // sorted unique today/future ISO dates
   export function defaultDay(d: Dataset, now: Date): string | null;
   export function dayLabelShort(iso: string): string;           // 'Πέμ'
   export function dayLabelLong(iso: string): string;            // 'Πέμπτη 17 Σεπ'
   export function isStale(d: Dataset, now: Date): boolean;
   export function formatGeneratedAt(iso: string): string;       // '13 Σεπτεμβρίου 2026'
   export function isUpcoming(date: string, time: string, now: Date): boolean;
   ```
   - `datesInDataset`: exclude every date before today in Europe/Athens. Expired dates must never appear in the selector.
   - `defaultDay`: today's ISO date if it appears in the covered dates; otherwise the **earliest future** date; `null` if no today/future dates remain.
   - `isStale`: true when today is absent from the covered dates **or** `generatedAt` is more than **10 days** before `now`. The 10-day rule is only a backstop.
   - `isUpcoming`: true only when `date` equals today in Europe/Athens and the date+time is at or after `now`. Tomorrow is never "Απόψε", even when no day filter is selected.
   - Greek day and month names live in `strings.ts` as arrays, not inline.
   - Use Europe/Athens as the reference zone for date arithmetic. Do not use a date library — `Intl.DateTimeFormat` with `timeZone: 'Europe/Athens'` is sufficient.
2. **`DaySelector.svelte`** — props: `dates: string[]`, `selected: string | null`, `onSelect: (iso: string | null) => void`. A horizontally scrolling row of chips styled exactly like the FilterBar chips (DESIGN.md §8.3), one per date, labelled with `dayLabelShort`, plus a leading "Όλες" chip for `null`. Selected chip uses `--accent-sunk` / `--accent`. Each chip is a `<button>` with `aria-pressed` and an `aria-label` using `dayLabelLong`. Render it inside `FilterBar` below the chip row.
3. **`StalenessBanner.svelte`** — prop `generatedAt: string`. Renders per DESIGN.md §8.5 using `strings.stalenessNotice(formatGeneratedAt(generatedAt))`. Placed directly below the header, above the filter bar. Not dismissible. Renders nothing when not stale — the parent decides via `isStale`.
4. **`+page.svelte`** — compute the covered dates and `defaultDay` once from the dataset and current time, then initialise `filters.day` through the task-05 URL helpers using `{ day: computedDefault }`. Omit `day` from the URL when it equals that default; an absent, expired, or unavailable URL day resolves to the computed default. Apply the day filter and the "Απόψε" filter to the visible film list: a film is visible when it has at least one screening on the selected day (and, when `tonight` is set, at least one still-upcoming screening **today** per `isUpcoming`). Pass `filters.day` to `CinemaPanel.selectedDay`. Show the banner when `isStale(dataset, new Date())`, including when no covered dates remain.
5. **`dates.test.ts`** — table-driven, with `now` injected. Cover: today present; today absent with a future date (expect earliest future and stale); expired dates excluded; only expired dates (expect `null` and stale); empty dataset (`null` and stale); `isStale` at exactly 10 days, 9 days, and 11 days while today is covered; `isUpcoming` at the current-time boundary, before/after midnight, and explicitly excluding tomorrow; Greek labels for all 7 days. Add page/filter-state integration tests for absent, explicit, unavailable, and expired `day` URL values and for selected-day propagation to the panel.

## Acceptance criteria

- [ ] `npm test` and `npm run check` pass; every `dates.ts` function has a test.
- [ ] Selecting a day narrows the grid; "Όλες" restores it.
- [ ] "Απόψε" shows only films with a remaining screening today.
- [ ] The banner appears whenever today is not covered (including when all dates expired), and the 10-day backstop behaves correctly when today is covered.
- [ ] The dataset-derived default day is absent from the URL; explicit valid non-default days survive reload; stale URL days reset cleanly.
- [ ] Day chips scroll horizontally at 360px without clipping.
- [ ] The banner never covers content or shifts layout after paint.

## Do not

- Do not hardcode Thu–Wed. The selector renders whatever dates the dataset contains.
- Do not call `new Date()` inside `dates.ts`.
- Do not add a date library (`date-fns`, `dayjs`, `luxon`).
- Do not make the banner dismissible or a toast.
