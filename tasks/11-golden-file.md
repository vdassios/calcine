# Task 11 — Golden file harness

**Depends on:** 10. **Read:** MASTER.md §4.6, §10.

## Goal

Capture every distinct `show_info` value the live site serves, with its parsed output, as a committed, hand-reviewed snapshot — then diff against it on every run so a flix format change surfaces as a diff rather than as silently dropped showtimes.

## Files

Create: `scripts/build-golden.ts`, `scripts/golden.ts`, `scripts/golden.test.ts`, `test/golden/showinfo.json`, `test/golden/showinfo.test.ts`, `docs/golden-review.md`.
Modify: `package.json` (add scripts).

## Steps

1. **`scripts/build-golden.ts`** — fetch live via `flixSource`, collect distinct `show_info` values **nationwide** (approximately 599; MASTER.md §4.3 requires all of them, not just the Athens 381), and for each emit:
   ```json
   {
     "input": "Πέμ έως Κυρ & Τετ: 20.30",
     "rowCount": 12,
     "screenings": [{ "day": "ΠΕΜ", "time": "20:30", "dubbed": false, "formats": [] }],
     "unparsed": []
   }
   ```
   Note `day`, not `date`: the golden file stores the **day code** so it stays stable week to week. Derive it from the parsed absolute date against a fixed `weekStart` the script passes in. Sort entries by `input` for a stable diff. Write pretty-printed JSON with a trailing newline.
2. **`rowCount`** is how many rows use that exact string. Reports must be **weighted by rows, not by unique values** — a format used by 40 rows matters more than one used once (MASTER.md §4.6).
3. **`scripts/golden.ts`** — expose two pure checks. `checkCommittedGolden()` reparses committed inputs and detects parser-output changes without network access. `compareLiveGolden(rows)` accepts the already-fetched nationwide rows, compares their distinct `showInfo` inputs and current parsed day-code outputs with the committed corpus, and returns a serialisable result with `pass`, `additions`, `removals`, and `changed` details. It must never fetch. Task 12 stores this result in build metrics so a live format change reaches the daily gate without a second flix request.
4. Add scripts: `golden:build` (regenerates, live) and `golden:check` (calls `checkCommittedGolden`; exits non-zero on any difference; **makes no network request**).
5. **Tests** — `showinfo.test.ts` runs the offline golden check in-process. `golden.test.ts` supplies synthetic already-fetched rows and asserts exact live additions, removals, changed outputs, and a matching corpus. Both must prove they make no network request. The two named `;` tests from task 10 must run in the same `npm test` command and remain mandatory before any re-bless.
6. **`docs/golden-review.md`** — the review record. After generating the file, a human reviews all entries and records: date reviewed, total entries, total rows covered, count of entries with non-empty `unparsed`, and every entry judged incorrect with the reason. **The task is not complete until this review is done and the file is committed.** A generated-but-unreviewed golden file is worthless — it would enshrine whatever the parser currently does, including its bugs.
7. Any entry found incorrect during review is a **defect in task 10** — fix the parser and regenerate. Do not adjust the golden file to match a wrong parser.

## Acceptance criteria

- [ ] `test/golden/showinfo.json` contains ~599 entries; the sum of `rowCount` equals the live row count (~915).
- [ ] `npm run golden:check` passes and makes no network request.
- [ ] `npm test` includes the golden check.
- [ ] `compareLiveGolden` detects a new, removed, or changed live input from supplied rows without fetching; task 12 can serialise its result unchanged.
- [ ] `docs/golden-review.md` records a completed human review with actual counts.
- [ ] Entries with non-empty `unparsed` are **fewer than 5% of total `rowCount`**.
- [ ] Every one of the ~599 committed inputs has a non-empty `screenings` array; `unparsed` reporting is a separate weighted metric, not a yield exemption.
- [ ] Deliberately breaking the parser (e.g. dropping `&` handling) makes `golden:check` fail.
- [ ] Re-blessing cannot bypass the named unit tests for both `;` cases.

## Do not

- Do not store absolute dates in the golden file — day codes only, so it survives week to week.
- Do not commit the file without the human review in `docs/golden-review.md`.
- Do not edit expected outputs to make a failing parser pass.
- Do not restrict the corpus to Athens.
