# Task 13 — Validation gate

**Depends on:** 12. **Read:** MASTER.md §4.4 in full, §12 (seasonality risk).

## Goal

Decide whether a freshly built dataset may be committed. **Gate on parse rate and shape, which detect breakage. Do not gate on volume, which detects the calendar.**

## Files

Create: `scripts/validate.ts`, `scripts/validate.test.ts`, `scripts/promote-data.ts`, `scripts/fixtures/gate/*.json`.
Modify: `package.json` (add `validate` and `promote:data`); generated on the first successful promotion: `src/lib/data/schedule.json`.

## Steps

1. Export:
   ```ts
   export type GateResult = { pass: boolean; checks: { name: string; pass: boolean; detail: string }[] };
   export function validate(next: Dataset, prev: Dataset | null, metrics: BuildMetrics): GateResult;
   ```
   `BuildMetrics` is imported from side-effect-free `scripts/build-metrics.ts`, never duplicated or imported from a CLI. `prev` is the currently committed `src/lib/data/schedule.json`, or `null` on first run (volume comparison skipped; floors still apply). The CLI reads `.build/schedule.candidate.json`, `.build/data-metrics.json`, and the committed previous dataset by those default paths; no value is scraped from stdout and the candidate never masquerades as `prev`.
2. Implement **exactly** the five checks in MASTER.md §4.4, no more and no fewer:

   | Check | Threshold | Fails on |
   |---|---|---|
   | `parseRate` | ≥ 0.95 of rows yield ≥1 screening | markup/format change |
   | `goldenDiff` | `metrics.golden.pass` must be true | live addition, removal, or parser-output change vs committed golden corpus |
   | `shape` | required keys present; `inAthensCoercionRate === 1`; every screening has ISO `date` and `HH:MM` `time`; every id resolves; `hallMerge.lossless`; `posterAssets.valid`; its referenced-filename list exactly equals the candidate's non-empty poster filenames | blob restructure or final asset/data mismatch |
   | `cliff` | > 50% showing-count drop vs `prev` | scrape failure |
   | `floor` | ≥ 30 cinemas **and** ≥ 20 films | catastrophic failure |

3. **The seasonality requirement is the point of this task.** In October, Athens' 91 open-air cinemas close and rows fall from ~506 toward ~220 over several weeks. That decline is **correct data** and must pass. Only a same-day cliff fails. Do not add a "row count within N% of last run" check — the previous design had one and it would have rejected correct data and frozen the site on a snapshot full of closed cinemas (MASTER.md §13).
4. On failure: print every failed check with its detail, exit non-zero, and **write nothing**. Validation never copies, renames, commits, or deletes files. The previously committed dataset keeps serving.
5. **`scripts/promote-data.ts`** — a separate command invoked only after `validate` exits 0. Atomically replace `src/lib/data/schedule.json` from `.build/schedule.candidate.json` using a sibling temporary file plus rename. It does not fetch, validate, or commit. The workflow must chain `npm run validate && npm run promote:data`; a failed left-hand command prevents promotion.
6. **Fixtures** in `scripts/fixtures/gate/`, each a small dataset plus metrics envelope:
   - `baseline.json` — ~500 showings, 109 cinemas, 90 films.
   - `seasonal-decline.json` — ~220 showings, 38 cinemas, reached gradually. **Must pass.**
   - `cliff.json` — ~40 showings. **Must fail** on `cliff`.
   - `broken-parse.json` — parse rate 0.60. **Must fail** on `parseRate`.
   - `malformed.json` — a screening with `date: 'Πέμ'`. **Must fail** on `shape`.
   - `bad-coercion.json` — `inAthensCoercionRate < 1`. **Must fail** on `shape`.
   - `hall-loss.json` — `hallMerge.lossless: false`. **Must fail** on `shape`.
   - `golden-mismatch.json` — live additions/removals/changes present. **Must fail** on `goldenDiff`.
   - `first-run.json` — used with `prev = null`. **Must pass.**
7. **`validate.test.ts`** — one test per fixture asserting both the overall verdict and **which named check** failed. Also assert that `seasonal-decline` passes when compared against `baseline`; validation failure leaves the committed file byte-identical; promotion is atomic and happens only in an explicit successful chain; the CLI reads previous/candidate/metrics from distinct paths.

## Acceptance criteria

- [ ] `npm test` passes; every fixture behaves as specified, including the live golden, coercion, and hall-loss failures.
- [ ] `npm run validate` exits 0 on good data and non-zero on each failure fixture.
- [ ] Failure output names the failed check and its measured value.
- [ ] The seasonal-decline case passes and has an explicit test with a comment referencing MASTER.md §4.4.
- [ ] No check anywhere compares row counts as a percentage band of the previous run.
- [ ] A passing final candidate can be atomically promoted; every validation failure leaves the committed dataset byte-identical.

## Do not

- Do not add a ±40% row-count band.
- Do not add checks not in the table.
- Do not let the gate write, commit, or delete anything — it only reports and sets the exit code.
- Do not make thresholds configurable by env var; they are decisions recorded in MASTER.md.
- Do not let `build:data` or `validate` call `promote:data` internally; promotion is an explicit post-gate workflow step.
