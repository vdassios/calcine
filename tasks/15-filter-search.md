# Task 15 — Filter and search functions

**Depends on:** 14. **Read:** MASTER.md §6 (Filtering), §10; task 05 for the `Filters` type.

## Goal

One pure, fully-tested function that turns a dataset plus filters into the visible film list. No Svelte, no DOM, no side effects.

## Files

Create: `src/lib/filter.ts`, `src/lib/filter.test.ts`, `src/lib/searchIndex.ts`.
Modify: `src/routes/+page.svelte` (replace the temporary substring filter from task 05).

## Steps

1. **`searchIndex.ts`** — build the compiled index once at load:
   ```ts
   export type SearchIndex = Map<FilmId, RegExp[]>;
   export function buildSearchIndex(d: Dataset): SearchIndex;
   ```
   A film's searchable text is the concatenation of: `titleEl`, `titleEn`, and — for every cinema showing that film — the cinema `name`, `region`, and `address`. Address and region are in the index deliberately: they are what replaced the deleted `town` field and what makes thumb-typing `kypseli` work (MASTER.md §4.5, §6).
2. **`filter.ts`** — export exactly:
   ```ts
   export function filterFilms(
     d: Dataset, f: Filters, index: SearchIndex, now: Date
   ): Film[];
   ```
   `now` is injected, never read from the clock inside, so tests are deterministic.
3. Apply filters in this order (cheapest first), a film surviving only if **all** pass:
   1. `type` — the film has a showing at a cinema of that `CinemaType`.
   2. `region` — the film has a showing at a cinema in that region.
   3. `cinema` — the film has a showing at that cinema.
   4. `day` — the film has a screening on that ISO date.
   5. `tonight` — the film has a screening today that `isUpcoming(date, time, now)` (task 07).
   6. `query` — `matchesText(index.get(film.id), f.query)`.
4. Result ordering: by `titleEl` using `localeCompare(…, 'el')`. Stable and deterministic.
5. Also export `availableCinemas(d, f)` returning the cinemas consistent with the current region filter, for the cascading dropdowns in task 05.
6. **`+page.svelte`** — build the index once at module scope (not per keystroke) and pass it to `$derived(filterFilms(...))`.
7. **`filter.test.ts`** — using `sampleDataset`: each filter alone; all filters combined; empty filters returns all films sorted; a query matching only a cinema name returns that cinema's films; a query matching only a region returns that region's films; a word-prefix query matching an address works; `tonight` includes the exact current-time boundary, excludes elapsed screenings, and excludes tomorrow even when `day` is null; unknown region/cinema returns `[]`; ordering uses Greek collation (`Ά` sorts with `Α`, not after `Ω`).
8. **Performance test**: expand `sampleDataset` deterministically in memory to the recorded production scale and require 1000 successive `filterFilms` calls to complete in under 200 ms total (~0.2 ms each, MASTER.md §3). Do not import the changing real dataset into a test.

## Acceptance criteria

- [ ] `npm test` and `npm run check` pass.
- [ ] `filterFilms` is pure: no `new Date()`, no DOM, no module-level mutable state.
- [ ] Typing in the search box filters instantly with **zero network requests**.
- [ ] The performance assertion passes.
- [ ] Task 05's temporary substring filter is gone.

## Do not

- Do not read the clock inside `filter.ts`.
- Do not debounce or memoise — the function is fast enough that caching adds bugs, not speed.
- Do not rebuild the search index on every keystroke.
- Do not mutate the dataset.
- Do not import anything from `svelte` in `filter.ts` or `searchIndex.ts`.
