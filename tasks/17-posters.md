# Task 17 — TMDB poster pipeline

**Depends on:** 13, **14** (provides `src/lib/homoglyphs.ts`). **Read:** MASTER.md §5 in full, §11, §2.17.

## Goal

Resolve each film to a poster, re-encode it to a fixed 2:3 WebP with a content-hashed filename, and never block on a miss.

## Files

Create: `scripts/posters.ts`, `scripts/posters.test.ts`, `scripts/placeholder.ts`, `scripts/data-budget.ts`, `scripts/data-budget.test.ts`, `static/tmdb-logo.svg`; generated/modified assets: `static/posters/**`, `.build/schedule.candidate.json`, and `.build/data-metrics.json`.
Also export `cleanTitle` from `scripts/posters.ts`. Imports `deglyph` from `src/lib/homoglyphs.ts` (task 14).
Modify: `package.json` (add `sharp`, `posters`, and `data:budget`), `data/film-ids.json` (gains `tmdbId` and `confirmed`), `scripts/build-dataset.ts` (reuses known poster filenames), `scripts/build-metrics.ts` (final poster-asset metrics), `src/lib/components/AppFooter.svelte` (TMDB logo), `MASTER.md` §2.15 (measured size and ceiling).

## Steps

1. **Resolution chain**, in order — clean query → TMDB (English) → TMDB (Greek, `language=el-GR`) → generated placeholder. **There is no second provider.** OMDb is not used: it receives the same dirty query and fails identically, and its posters are Amazon/IMDb-hosted (MASTER.md §5). **flix images are not in the chain at all** and must not be fetched or mirrored — the reason is copyright, not runtime independence (MASTER.md §5, §13).

2. **Clean the query first.** This recovers more films than any fallback source would. Export `cleanTitle(s: string): string` which, in order:
   - Calls **`deglyph` imported from `src/lib/homoglyphs.ts`** (built in task 14). **Do not reimplement the map here** — one definition, imported by both the search index and the poster pipeline, so they can never disagree about what a title is.
   - Strips parentheticals: `L' Affaire Bojarski (The Moneymaker)` → `L' Affaire Bojarski`.
   - Collapses whitespace and trims.

3. **Match by title similarity, never by release date.** The blob has no year (MASTER.md §2.11), and a release-date window is **forbidden**: 25 of 90 Athens films are repertory and a window rejects every one (MASTER.md §2.16, §5). Instead:
   - `GET /search/movie` with the **cleaned English title**; keep only results with a `poster_path`.
   - If empty, retry with the **Greek title** and `language=el-GR`.
   - Sort candidates by `popularity`, take the top 5, and select the one maximising similarity against `title`, `original_title`, and the Greek title. Use a normalised `SequenceMatcher`-style ratio (lowercase, strip non-alphanumerics).
   - **Similarity ≥ 0.75 → `confirmed: true` automatically. Below 0.75 → `confirmed: false` and into the review queue.** This guard catches errors a date window cannot: popularity alone matched `Mr. Klein` to *The Incredible Shrinking Man*.
   - If no candidate at all, emit the placeholder.
4. **Confirmation workflow.** Every film below the similarity threshold is written to `data/film-ids.json` with `confirmed: false`. At the end of the run print a review list: film title, chosen TMDB title, TMDB id, and URL. A human flips `confirmed` to `true`. **An unconfirmed candidate is never downloaded or written into `Film.poster`; generate and assign the title placeholder instead until approval.** Already-confirmed entries are never re-resolved — the mapping and its poster are reused across runs (MASTER.md §5).
5. **Rate limit**: at most 40 requests per 10 seconds. Only unresolved films are looked up (~10–20 per week), so a simple sequential loop with a 300 ms delay is sufficient. Do not parallelise.
6. **Encoding**: download the poster, re-encode to **WebP at one fixed 2:3 size — 300×450** — and write to `static/posters/{filmId}-{hash}.webp`, where `hash` is the first 8 hex characters of the SHA-256 of the encoded bytes. The content hash is mandatory: `static/` is served unhashed, so a fixed filename means a corrected poster never reaches users who cached the wrong one (MASTER.md §5). Delete superseded files for that `filmId`. Use `sharp` — the only new dependency this task may add.
7. **`placeholder.ts`** — generate a neutral card at 300×450 for films with no confirmed poster, matching `PosterPlaceholder.svelte` from task 04. Read the light `--surface-sunk` and `--text-faint` values from `src/lib/styles/tokens.css`; do not duplicate their hex values in TypeScript. Encode and content-hash it by the same filename rule. No gradient, no icon, no additional colour.
8. **Candidate update** — `npm run posters -- --dataset .build/schedule.candidate.json` consumes and updates the candidate in place, setting every `Film.poster` to the **filename only** (`f012-a1b2c3d4.webp`), never a full path or URL. It makes no flix request. `build-dataset.ts` reuses an existing valid filename on later runs but never invents one. Inspect every referenced asset after writing: WebP format, exact 300×450 dimensions, and filename hash. Update `posterAssets` in `.build/data-metrics.json` with the sorted referenced filenames, measured totals, and `valid`; task 13 checks that list against the final candidate.
9. **Footer** — replace the task 03 TODO with TMDB's **approved logo** stored at `static/tmdb-logo.svg` and the exact prescribed notice already in `strings.ts`. Obtain the logo from TMDB's official branding assets, record its source in the task result, and do not redraw, alter, or hotlink it.
10. **`posters.test.ts`** — with HTTP mocked. Required cases, using the real strings from live data:
   - `cleanTitle("Βreakfast at Tiffany's")` (Greek beta) → `"Breakfast at Tiffany's"`.
   - `cleanTitle("L'Εclisse")` (Greek epsilon) → `"L'Eclisse"`.
   - `cleanTitle("L' Affaire Bojarski (The Moneymaker)")` → `"L' Affaire Bojarski"`.
   - `cleanTitle("Πολύ Κοριτσίστικο Ονομα το Πάττυ")` is **unchanged** — a predominantly Greek string must not be homoglyph-mapped.
   - `cleanTitle` produces the same homoglyph result as `normalize` from task 14 for the same input, since both call the same `deglyph`.
   - A **1996 film** (`Trainspotting`) resolves successfully — the regression test for the removed date window.
   - A similarity of 0.54 (`Bernard: Mission Mars` → `Backkom Bear 3`) yields `confirmed: false`.
   - That unconfirmed candidate ships a generated placeholder filename and never its TMDB image bytes.
   - A similarity of 1.0 yields `confirmed: true`.
   - An empty English title falls through to the Greek `language=el-GR` search.
   - A total miss produces a placeholder and does **not** throw.
   - A confirmed entry is not re-resolved.
   - The same image bytes produce the same hash; changed bytes produce a new filename.
11. **Payload budget** — `data-budget.ts` accepts an explicit dataset path and gzips it with fixed deterministic options. On the first final poster-linked candidate, set the ceiling to measured gzip bytes +25%, rounded up to the next KiB; record both numbers in MASTER.md §2.15 and in one exported constant. `npm run data:budget -- .build/schedule.candidate.json` exits non-zero above it. Test exact-boundary pass and one-byte-over failure without weakening the ceiling.

## Acceptance criteria

- [ ] A full run resolves posters for the ~90 Athens films, printing the unconfirmed review list.
- [ ] Every file in `static/posters/` is WebP, exactly 300×450, with a hashed filename.
- [ ] Total poster weight is under 2 MB.
- [ ] Films with no poster render the placeholder, and the grid has no holes.
- [ ] Every unconfirmed match also renders a generated placeholder until a human approves it.
- [ ] No flix.gr image URL appears anywhere in the codebase or output.
- [ ] The footer shows the TMDB logo and prescribed notice.
- [ ] `npm test` passes with no network access.
- [ ] `TMDB_API_KEY` is read from env and is not committed. **No OMDb key is used anywhere.**
- [ ] Measured against live data: **≥ 80 of ~90 films auto-confirm**, matching the 84/3/3 baseline in MASTER.md §5. A materially worse rate means the matching logic deviates from the spec.
- [ ] Initial integration runs `build:data` → `posters` → `data:budget` → `validate` → `promote:data`; the promoted JSON references only assets that exist and passed validation.
- [ ] The measured final gzip size and +25%-then-next-KiB numeric ceiling are recorded and enforced by the command and tests.

## Do not

- Do not fetch, mirror, or link flix.gr images.
- Do not use unhashed poster filenames.
- Do not re-resolve confirmed entries.
- Do not exceed the rate limit or parallelise requests.
- Do not use TMDB's `vote_average` or any rating field — Calcine shows no ratings (MASTER.md §11).
- **Do not filter candidates by release date or year.** 25 of 90 Athens films are repertory; a window rejects all of them (MASTER.md §2.16).
- Do not add OMDb or any second poster provider.
- Do not define a homoglyph map in this task — import `deglyph` from `src/lib/homoglyphs.ts`.
- Do not commit API keys.
