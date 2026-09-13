# Task 03 — Types, fixtures, app shell

**Depends on:** 02. **Read:** MASTER.md §4.7, §6; DESIGN.md §§8.7, 9, 10.

## Goal

The canonical data types, a realistic fixture dataset, and the page shell (header, footer, container) that later UI tasks fill in.

## Files

Create: `src/lib/types.ts`, `src/lib/strings.ts`, `src/lib/fixtures/sample.ts`, `src/lib/components/AppHeader.svelte`, `src/lib/components/AppFooter.svelte`.
Modify: `src/routes/+page.svelte`, `src/routes/+layout.svelte`, `src/lib/components/ThemeToggle.svelte`.

## Steps

1. **`types.ts`** — transcribe from MASTER.md §4.7, exactly:
   ```ts
   export type FilmId = string;
   export type CinemaId = string;
   export type CinemaType = 'Θερινός' | 'Multiplex' | 'Μονή Αίθουσα';

   export type Screening = {
     date: string;      // ISO date, 'YYYY-MM-DD'
     time: string;      // 'HH:MM', 24-hour
     dubbed: boolean;
     formats: string[]; // e.g. ['Dolby Atmos']
   };
   export type Film = {
     id: FilmId; titleEl: string; titleEn: string;
     tmdbId: number | null; poster: string;   // filename in /posters/
   };
   export type Cinema = {
     id: CinemaId; name: string; region: string;
     address: string; type: CinemaType;
   };
   export type Showing = {
     filmId: FilmId; cinemaId: CinemaId; hall: string;
     screenings: Screening[];
   };
   export type Dataset = {
     generatedAt: string;   // ISO datetime
     sources: string[];
     films: Film[]; cinemas: Cinema[]; showings: Showing[];
   };
   ```
2. **`strings.ts`** — a flat `export const t = { ... } as const;` of Greek UI strings. Include at minimum: `siteName: 'Calcine'`, `tagline`, `searchPlaceholder`, `tonight`, `allTypes`, `allDays`, `regionLabel`, `cinemaLabel`, `noResults`, `clearFilters`, `close`, `dubbedShort: 'ΜΕΤΑΓΛ.'`, `filmCount: (count: number) => \`${count} ταινίες\``, `resultCount` (a Greek count function for the live region), all short/long Greek day names and month names needed by task 07, `stalenessNotice` (a function taking a formatted date, per DESIGN.md §8.5), `attributionFlix`, and `attributionTmdb: 'This product uses the TMDB API but is not endorsed or certified by TMDB.'`, plus the two theme labels from DESIGN.md §6. Update `ThemeToggle.svelte` to import those labels instead of retaining its task-02 literals. The TMDB sentence is prescribed copy and must remain exact. **No hardcoded user-visible text anywhere else in the codebase.**
3. **`fixtures/sample.ts`** — export `export const sampleDataset: Dataset`. It must contain **exactly**:
   - **12 films** with real-looking Greek and English titles, `tmdbId: null`, `poster: ''`. Include at least two titles longer than 30 characters to exercise the 2-line clamp.
   - **8 cinemas** across **4 distinct `region` values**, covering all three `CinemaType` values, with at least 4 of type `'Θερινός'`.
   - **~30 showings**. These must include: one film in **4 different halls at the same cinema** (exercises hall merging); duplicate `(time, dubbed)` slots across two halls with different non-empty `formats` arrays; one showing where the same `(film, cinema, date)` has both `dubbed: true` and `dubbed: false` screenings; one film in a single cinema only; one film with no screenings for 3 of the 7 days.
   - Dates spanning a **Thursday→Wednesday** window. Compute them relative to a **fixed hardcoded Thursday** so the fixture is deterministic — do not use `new Date()`.
   - `generatedAt` set to that Thursday at 03:00 UTC; `sources: ['flix.gr']`.
4. **`AppHeader.svelte`** — site name (`--text-xl`) left, `<ThemeToggle>` right, per DESIGN.md §8.7. Not sticky.
5. **`AppFooter.svelte`** — attribution per DESIGN.md §8.7 and MASTER.md §11: a linkback to `https://flix.gr` naming it as the schedule source, and the exact TMDB notice from `strings.ts`. Leave a clearly commented `<!-- TODO task 17: TMDB logo -->` placeholder for the logo — do not source a logo yourself.
6. **`+page.svelte`** — render header, a `<main>` container per DESIGN.md §5, and footer. Import `sampleDataset` and render `t.filmCount(sampleDataset.films.length)` as a temporary body. Tasks 04–07 replace the body.

## Acceptance criteria

- [ ] `npm run check` reports 0 errors.
- [ ] `npm run build` succeeds.
- [ ] The page shows header, count, and footer, correct in both themes.
- [ ] The container is full-bleed with `--space-4` padding below 900px and `max-width: 1200px` centred above 1200px.
- [ ] `sampleDataset` satisfies every count and case listed in step 3.
- [ ] No user-visible string appears outside `strings.ts`.
- [ ] The footer contains the exact prescribed TMDB notice; only its logo remains deferred to task 17.

## Do not

- Do not deviate from the type definitions — later tasks depend on them exactly.
- Do not add an `inAthens`, `town`, or `rating` field. All three were deliberately removed (MASTER.md §13).
- Do not use `new Date()` in the fixture.
- Do not build the grid, filters, or panel here.
