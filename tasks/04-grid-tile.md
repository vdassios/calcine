# Task 04 — FilmGrid and FilmTile

**Depends on:** 03. **Read:** MASTER.md §5 (storage), §6 (Grid); DESIGN.md §§8.1, 8.2, 8.6, 10.

## Goal

The poster grid: CLS-free, keyboard-operable, correct in both themes, with a generated placeholder for films that have no poster.

## Files

Create: `src/lib/components/FilmGrid.svelte`, `src/lib/components/FilmTile.svelte`, `src/lib/components/PosterPlaceholder.svelte`, `src/lib/components/FilmGrid.test.ts`.
Modify: `src/routes/+page.svelte`.

## Steps

1. **`FilmTile.svelte`** — props: `film: Film`, `expanded: boolean`, `priority: boolean`, `onToggle: (id: FilmId) => void`.
   - Root is a `<button type="button">` with the reset in DESIGN.md §8.2, `aria-expanded={expanded}`, and `aria-controls` pointing at the panel id (`panel-{film.id}`).
   - Poster wrapper: `aspect-ratio: 2/3`, `--radius-md`, `overflow: hidden`, `background: var(--surface-sunk)`.
   - If `film.poster` is non-empty render `<img src="/posters/{film.poster}" alt="" width="300" height="450">` (decorative — the title is adjacent text, so `alt` is intentionally empty), styled with `width: 100%; height: 100%; object-fit: cover; display: block`. If empty, render `<PosterPlaceholder>`.
   - When `priority` is true set `fetchpriority="high"` and **omit** `loading`. Otherwise set `loading="lazy" decoding="async"`.
   - Title below: `--text-xs`, 2-line clamp per DESIGN.md §8.2. Show `film.titleEl`.
   - Expanded state styling per DESIGN.md §8.2. Hover per §7, inside `@media (hover: hover)`.
2. **`PosterPlaceholder.svelte`** — prop `title: string`. A `--surface-sunk` filled box, `aspect-ratio: 2/3`, with the title in `--text-xs` `--text-faint`, padded `--space-3`, clamped to 4 lines, vertically centred. Mark this duplicate title `aria-hidden="true"`; the adjacent tile title is the button's single accessible name. No image, no gradient, no icon.
3. **`FilmGrid.svelte`** — props: `films: Film[]`, `expandedId: FilmId | null`, `onToggle: (id: FilmId) => void`, `onClear?: () => void`.
   - Grid CSS exactly per DESIGN.md §8.1 including both breakpoints.
   - `{#each films as film, i (film.id)}` — **the keyed form is mandatory** so Svelte moves nodes instead of recreating them (MASTER.md §6).
   - Pass `priority={i < 6}`.
   - When `films.length === 0`, render the empty state per DESIGN.md §8.6 instead of the grid. `onClear` prop drives the clear-filters button; if no handler is supplied, hide that button.
4. **`+page.svelte`** — replace the temporary count with `<FilmGrid>` fed from `sampleDataset.films`. Hold `expandedId` in a `$state` rune; `onToggle` sets it, or clears it if the same id is passed again.
5. **`FilmGrid.test.ts`** — assert: renders one button per film; each button's accessible name is exactly its single Greek title, including with a placeholder; clicking calls `onToggle` with the film id; `aria-expanded` is `true` only on the expanded tile; passing `[]` renders the empty-state message from `strings.ts`; the clear button is present only when `onClear` is supplied; the first 6 images carry `fetchpriority="high"` and the 7th carries `loading="lazy"`.

## Acceptance criteria

- [ ] `npm test` and `npm run check` pass.
- [ ] At 360px the grid shows 2 columns; at 1280px it shows 6 columns with the specified padding, gaps, and 1200px container.
- [ ] Poster images fill their reserved 2:3 wrappers without changing computed dimensions after load.
- [ ] Every tile is reachable by Tab and activates with both Enter and Space.
- [ ] DevTools Performance recording of a page load reports **CLS = 0**.
- [ ] Both themes correct; placeholder legible in both.
- [ ] No `box-shadow` on any tile.

## Do not

- Do not use `<div on:click>` for the tile.
- Do not add scale, translate, or shadow on hover.
- Do not use `aspect-ratio: 1` — posters are 2:3 (MASTER.md §13).
- Do not omit the `(film.id)` key.
- Do not add a loading skeleton or shimmer. Data is bundled; there is no loading state.
