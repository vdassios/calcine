# Task 12 — Dataset builder

**Depends on:** 11. **Read:** MASTER.md §4.1, §4.3, §4.7, §2 (facts 4, 5, 8, 14).

## Goal

Fetch once and turn nationwide rows into a three-table Athens **candidate** plus machine-readable metrics, with stable IDs, rename review, and hall-keyed showings. This task never overwrites the deployed dataset.

## Files

Create: `scripts/build-dataset.ts`, `scripts/build-metrics.ts`, `scripts/ids.ts`, `scripts/ids.test.ts`, `scripts/build-dataset.test.ts`, `data/film-ids.json`, `data/cinema-ids.json`, `data/identity-decisions.json`; generated/ignored outputs: `.build/schedule.candidate.json`, `.build/data-metrics.json`, `.build/identity-review.json`.
Modify: `package.json` (add `build:data`), `.gitignore` (ignore `.build/`).

## Steps

1. **`scripts/ids.ts`** — stable identity. Export:
   ```ts
   export type IdMap = Record<string, { id: string; confirmed?: boolean; tmdbId?: number | null }>;
   export function loadIdMap(path: string): IdMap;
   export function ensureId(map: IdMap, sourceLabel: string, prefix: 'f' | 'c'): string;
   export function assignAlias(map: IdMap, sourceLabel: string, existingId: string): void;
   export function saveIdMap(path: string, map: IdMap): void;
   ```
   - Film key is the Greek source title verbatim, falling back to the English title only when Greek is empty; cinema key is the source cinema name verbatim. The value holds the assigned stable ID. Use this same key rule everywhere, including poster metadata.
   - A new, unrelated label gets the next sequential id (`f001`, `c001`) based on the highest id already present, not the number of keys (aliases share ids). **Existing entries are never renumbered or removed.** `assignAlias` lets a corrected label map to an existing id; reject an unknown id or an attempt to remap an existing label to a different id.
   - `saveIdMap` writes sorted, pretty-printed JSON with a trailing newline, so diffs are readable.
2. **Rename review before allocation.** Compare labels in the candidate with entities in the committed previous dataset when it exists:
   - Film: flag a new identity key as a suspected rename when its normalised English title matches a previous film but the Greek title changed, or when a Greek-empty fallback transition preserves the other title.
   - Cinema: flag a new name when normalised address and region match a previous cinema whose name changed.
   - Write each suspected pair and its proposed prior id to `.build/identity-review.json`, print it, and exit non-zero **before saving id maps or a candidate**. A human either adds the new source label with `assignAlias` semantics to the prior id, or records the exact old/new pair as intentionally distinct in committed `data/identity-decisions.json`; only then may the build rerun. Unrelated additions allocate normally. This prevents source corrections from silently orphaning URLs and posters while preserving an auditable decision for legitimate lookalikes.
3. **`scripts/build-dataset.ts`** — pipeline, in this exact order:
   1. `flixSource.fetch()` → all ~915 rows.
   2. Immediately call `compareLiveGolden(rows)` from task 11 with those same rows. **Do not fetch again.** Preserve its complete serialisable result for the gate.
   3. **Filter to `inAthens === true`** (~506 rows). This is the only place the Athens scope is applied (MASTER.md §4.3).
   4. Compute `weekStart` = the ISO date of the Thursday of the current cinema week in Europe/Athens.
   5. For each row, `parseShowInfo(row.showInfo, weekStart)`.
   6. Run the rename review above, then assign stable ids.
   7. **Clean `hall`**: strip promotional substrings before using it as an identity component. Remove any run matching `/€\S*/` and any trailing `EUROBANK`-style promo token, collapse whitespace, trim. `ΑΙΘΟΥΣΑ 11 €ΠΙΣΤΡΟΦΗ EUROBANK` → `ΑΙΘΟΥΣΑ 11`. Preserve `(Θερινό)` — it describes the hall, not a promotion.
   8. Group into `Showing` keyed **`(filmId, cinemaId, cleanedHall)`** — required for correctness; without hall, 119 rows collide (MASTER.md §2.8).
   9. Emit `Dataset` per `src/lib/types.ts`: `films`, `cinemas`, `showings`, `generatedAt` (ISO now), `sources: ['flix.gr']`.
   10. Write only `.build/schedule.candidate.json`, pretty-printed with a trailing newline. Never write `src/lib/data/schedule.json`; task 13 owns promotion after validation.
   11. Define and export the serialisable `BuildMetrics` interface from side-effect-free `scripts/build-metrics.ts`; never import a CLI module merely to obtain its type. Write `.build/data-metrics.json` with this exact top-level data: row/film/cinema/showing/screening counts; `parseRate`; `unparsedCount`; `inAthensCoercionRate` (1 after the strict adapter succeeds); the complete `golden` result; `hallMerge` containing current colliding-pair count, source unique-slot count, display unique-slot count, format counts, and `lossless`; `posterAssets` initially containing an empty referenced-filename list and `valid: true`; and candidate `gzipBytes`. Print the same summary for humans, but downstream commands read the JSON, never stdout.
4. **Hall-merge accounting.** For every current `(film, cinema)` pair represented by multiple hall rows (43 in the recorded baseline), compute the display union using task 06's `(date, time, dubbed)` rule and format union. Assert that every source slot and format survives. Store aggregate counts and `lossless` in metrics; this is an all-pairs check, not a spot sample.
5. **No `town` field.** Address parsing is unreliable and the field was deliberately removed (MASTER.md §2.14, §13). Do not derive it. No `inAthens` or `rating` appears in output.
6. **Tests** — `ids.test.ts`: new and existing ids; two historical labels intentionally sharing one id; alias-safe next-id allocation; invalid alias rejection; labels never removed; sorted output. `build-dataset.test.ts`, with fetch mocked: exactly one flix request; live golden result preserved; only Athens rows survive; coercion metric is present; hall cleaning; four halls remain four `Showing` records; all collision slots and differing formats survive display-merge accounting; suspected film/cinema renames block before map/candidate writes; unrelated additions allocate normally; candidate and metrics match their schemas.

## Acceptance criteria

- [ ] `npm run build:data` makes one flix request and writes only the candidate and metrics, with ~90 films, ~109 cinemas, and 61 distinct regions.
- [ ] Metrics carry parse rate, coercion rate, live golden detail, lossless all-pairs hall accounting, and gzip bytes in machine-readable form.
- [ ] Running twice produces byte-identical output apart from `generatedAt`.
- [ ] All ids are stable across the two runs.
- [ ] `npm test` and `npm run check` pass.
- [ ] Every screening carries an absolute ISO date; no day codes appear in the output.
- [ ] A source-label correction can map to the old id; suspected renames cannot silently allocate and proceed.

## Do not

- Do not merge halls here.
- Do not write schedule data to `static/` or overwrite `src/lib/data/schedule.json`.
- Do not derive `town`.
- Do not renumber or garbage-collect id maps.
- Do not include films with zero screenings after parsing.
- Do not fetch flix more than once per build.
