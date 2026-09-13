# Task 09 — flix.gr adapter

**Depends on:** 03. **Read:** MASTER.md §2 (facts 1–13), §4.2, §4.3.

## Goal

Fetch the flix.gr blob and return typed raw rows. **No parsing of `show_info`, no Athens filtering, no date logic** — those belong to tasks 10 and 12.

## Files

Create: `scripts/sources/types.ts`, `scripts/sources/flix.ts`, `scripts/sources/flix.test.ts`, `scripts/fixtures/flix-sample.json`.

## Steps

1. **`scripts/sources/types.ts`**:
   ```ts
   export type RawScreening = {
     filmTitleEl: string;   // from title_local
     filmTitleEn: string;   // from title
     cinema: string;
     hall: string;          // '' when absent
     region: string;
     address: string;
     type: string;          // 'Θερινός' | 'Multiplex' | 'Μονή Αίθουσα'
     showInfo: string;
     inAthens: boolean;     // coerced from the STRING 'true'/'false'
   };
   export interface Source {
     name: string;
     coverage: 'national' | 'athens' | 'partial';
     fetch(): Promise<RawScreening[]>;
   }
   ```
2. **`scripts/sources/flix.ts`** — export `export const flixSource: Source`.
   - Identity is fixed: `name: 'flix.gr'`, `coverage: 'national'`.
   - URL: **`https://flix.gr/search-movies-in-cinemas/`**. The apex domain is mandatory — `https://www.flix.gr` fails TLS certificate validation (MASTER.md §2.2).
   - Send a normal desktop browser `User-Agent`. Set a 60-second timeout via `AbortSignal.timeout(60_000)`.
   - Extract the contents of `<script id="schedule-json" …>…</script>` and `JSON.parse` it. Throw a descriptive `Error` if the tag is missing — this is the primary breakage signal for the gate in task 13.
   - Map each row to `RawScreening`. **`in_athens` must be coercible from the string `'true'` or `'false'`** (case-insensitive). Reject and throw a descriptive shape error for any other or missing value; after validation, coerce with `String(v).toLowerCase() === 'true'`, never with a truthy test (MASTER.md §2.6). This makes the coercion requirement observable before `inAthens` disappears from the shipped model.
   - `hall`: use `''` when the field is missing, null, or empty.
   - Return **all rows**, nationwide. Do not filter (MASTER.md §4.3).
   - Throw if the parsed value is not an array. After mapping, require at least 30 distinct cinema names and 20 distinct film labels; report both measured counts on failure. Do not use a nationwide row-count proxy for the Athens validation floor.
3. **`scripts/fixtures/flix-sample.json`** — a committed fixture of **40 real rows** captured from the live blob: 20 Athens and 20 non-Athens, selected to cover at least 30 distinct cinemas and 20 distinct film labels so the normal mocked fetch passes the source floor. Include at least one row with an empty `hall`, one with a promotional hall string, one of each `type`, one carrying `(Μεταγλωττισμένο)`, and the two rows whose `show_info` uses `;` instead of `:`.
4. **`flix.test.ts`** — run entirely against the fixture with `fetch` mocked. Assert: `flixSource.name === 'flix.gr'`; `coverage === 'national'`; 40 rows map correctly; `inAthens` is a boolean and the strings `'true'`/`'false'` map correctly; invalid or missing `in_athens` throws the named shape error; missing `hall` becomes `''`; a missing `<script>` tag throws; a non-array payload throws; fewer than 30 cinemas or 20 films throws with measured counts. **No test may hit the network.**

## Acceptance criteria

- [ ] `npm test` passes with no network access (run with the network disabled to confirm).
- [ ] A manual one-off run against the live site returns ≥900 rows, of which ~506 have `inAthens === true`.
- [ ] `npm run check` reports 0 errors.
- [ ] The fixture contains all the specific cases listed in step 3.

## Do not

- Do not use the `www` subdomain.
- Do not filter to Athens here.
- Do not parse `show_info` here.
- Do not read `image`, `release__reviews__rating`, `rating_stars`, `subtext_html`, or `url`. Posters come from TMDB and ratings are not used at all (MASTER.md §11).
- Do not add an HTTP client dependency — use built-in `fetch`.
- Do not add retry logic; the gate in task 13 handles failure.
