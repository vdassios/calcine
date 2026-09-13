# Calcine build tasks

Each file in this directory is a **self-contained work order**. Hand one to a builder; it should require no decisions and no reading beyond the three documents named in it.

## Rules for every task

1. Read [MASTER.md](../MASTER.md) §§ named in the task, and [DESIGN.md](../DESIGN.md) in full for any UI task.
2. **Make no design or architecture decisions.** If something is unspecified, stop and report the gap. Do not invent a value, colour, threshold, or API shape.
3. Do not touch files outside the task's "Files" list.
4. Do not add dependencies beyond those listed.
5. Run the task's verification commands. All must pass before reporting done.
6. Do not proceed to the next task.

## Order

Presentation is built first against fixtures, so the visual layer is settled before real data lands.

### Phase 0 — Presentation

| # | Task | Depends on |
|---|---|---|
| 01 | [Project scaffold](./01-scaffold.md) | — |
| 02 | [Design tokens and theme toggle](./02-tokens-theme.md) | 01 |
| 03 | [Types, fixtures, app shell](./03-types-fixtures-shell.md) | 02 |
| 04 | [FilmGrid and FilmTile](./04-grid-tile.md) | 03 |
| 05 | [FilterBar](./05-filterbar.md) | 04 |
| 06 | [CinemaPanel](./06-cinema-panel.md) | 05 |
| 07 | [DaySelector and StalenessBanner](./07-day-staleness.md) | 06 |
| 08 | [Accessibility and CLS verification](./08-a11y-cls.md) | 04–07 |

### Phase 1 — Data

| # | Task | Depends on |
|---|---|---|
| 09 | [flix.gr adapter](./09-flix-adapter.md) | 03 |
| 10 | [show_info parser](./10-showinfo-parser.md) | 09 |
| 11 | [Golden file harness](./11-golden-file.md) | 10 |
| 12 | [Dataset builder](./12-dataset-builder.md) | 11 |
| 13 | [Validation gate](./13-validation-gate.md) | 12 |
| 14 | [Greeklish matcher](./14-greeklish.md) | 03 |
| 15 | [Filter and search functions](./15-filter-search.md) | 14 |
| 16 | [Wire real data into the UI](./16-wire-real-data.md) | 08, 13, 15 |
| 17 | [TMDB poster pipeline](./17-posters.md) | 13, 14 |
| 18 | [CI, refresh workflow, deployment](./18-ci-deploy.md) | 16, 17 |
