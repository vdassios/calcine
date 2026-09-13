# Task 16 — Wire real data into the UI

**Depends on:** 08, 13, 15. **Read:** MASTER.md §6 (Data loading), §13.

## Goal

Replace fixtures with the real committed dataset. The fixtures stay — they become test data.

## Files

Create: `src/lib/dataset.ts`, `docs/verification-16.md`.
Modify: `src/routes/+page.svelte`, `tsconfig.json` if `resolveJsonModule` is absent.

## Steps

1. **`dataset.ts`**:
   ```ts
   import data from './data/schedule.json';
   import type { Dataset } from './types';
   export const dataset = data as Dataset;
   ```
   **A static `import`, not `fetch`, not `$app/paths`, not a `+page.ts` load.** This is what gets the file bundled with a content-hashed filename, so a data refresh invalidates the CDN cache automatically. A file in `static/` keeps its URL forever and would serve yesterday's JSON (MASTER.md §6, §13).
2. Verify `resolveJsonModule` is enabled in `tsconfig.json`.
3. **`+page.svelte`** — import `dataset` instead of `sampleDataset`. Everything else stays: filters, index, grid, panel, day selector, banner.
4. Confirm the built output contains **no** `fetch` of schedule data and that the page renders fully with JavaScript disabled after prerender (posters, titles and times all present in the HTML).
5. Keep `src/lib/fixtures/sample.ts` — every component test continues to use it. **Tests must not import the real dataset**, which changes daily and would make them non-deterministic.
6. Spot-check correctness by hand, per MASTER.md §10: pick **5 films** and verify their cinemas and times against live flix.gr, then pick **2 Athens cinemas** and verify all listed films/times against their flix rows. There is no Athinorama validation step. Record results in `docs/verification-16.md` with the date checked, since the underlying data changes.
7. Record the task-12 hall accounting for the current live candidate: every current multi-hall `(film, cinema)` pair (43 in the recorded baseline), source/display unique-slot totals, format totals, and `lossless: true`. Manually inspect at least one four-hall pair in the panel. This verification complements deterministic fixture tests without making component tests import the changing dataset.

## Acceptance criteria

- [ ] `npm run build` succeeds and `build/_app/immutable/` contains the schedule JSON with a **hashed filename**.
- [ ] `grep -rn 'schedule.json' build/index.html` finds nothing (it is bundled, not referenced by path).
- [ ] The page renders ~90 films from real data.
- [ ] Network tab shows **zero** requests for schedule data after load.
- [ ] Search, day selector, "Απόψε", type chips and the panel all work against real data.
- [ ] `docs/verification-16.md` records the dated 5-film and 2-cinema flix checks plus current all-pairs hall accounting and one four-hall panel inspection.
- [ ] `npm test` passes and no test imports `src/lib/data/schedule.json`.
- [ ] No production module except `src/lib/dataset.ts` imports `sampleDataset`.

## Do not

- Do not move `schedule.json` into `static/`.
- Do not fetch it at runtime.
- Do not delete the fixtures.
- Do not let tests depend on real data.
