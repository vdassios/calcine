# Task 10 — show_info parser

**Depends on:** 09. **Read:** MASTER.md §4.5, §4.6, §2 (facts 3, 9).

## Goal

Turn a free-text Greek `show_info` string into dated, timed screenings. This is the highest-risk component in the project. It must **never throw**.

## Files

Create: `scripts/parse-showinfo.ts`, `scripts/parse-showinfo.test.ts`.

## Steps

1. Export exactly:
   ```ts
   export type ParsedScreening = { date: string; time: string; dubbed: boolean; formats: string[] };
   export type ParseResult = { screenings: ParsedScreening[]; unparsed: string[] };
   export function parseShowInfo(showInfo: string, weekStart: string): ParseResult;
   ```
   `weekStart` is the ISO date of the **Thursday** the cinema week begins. Every day code resolves to an absolute date within that Thursday→Wednesday window.
2. Algorithm, in this order:
   - **Normalise** outside parenthetical contents: strip Greek diacritics (`Σάβ` and `Σαβ` both occur), uppercase day syntax, and collapse whitespace. Preserve a display-safe trimmed value for non-dubbing format labels.
   - **Recognise segment heads, never split blindly on commas.** A head is a valid day specification followed by `:` or `;`. A comma belongs to a day list when it occurs inside the day specification before that delimiter, belongs to a time list after the delimiter, and starts a new segment only when the following tokens form another complete valid day specification plus delimiter. Thus `Σάβ, Κυρ: 11:20, 14:15, Δευ: 20:30` is two segments, with the first two commas serving different grammatical roles.
   - **Attach parenthetical tags after segment/time tokenisation.** A tag before the first segment is a whole-string default; a tag immediately before a later segment head is that segment's default; a tag following a valid time applies **only to that immediately preceding time**. `(ΜΕΤΑΓΛΩΤΤΙΣΜΕΝΟ)` sets `dubbed`; every other parenthetical is a `formats` entry. Per-time tags override only their own screening and must never leak to sibling times.
   - **Expand day specs**: single day (`ΠΕΜ`); lists joined by `,` or `&`; ranges with `ΕΩΣ`, expanded over the **Thursday-indexed** week so `ΠΕΜ ΕΩΣ ΤΕΤ` is all seven days and `ΣΑΒ ΕΩΣ ΔΕΥ` wraps correctly.
   - **Normalise times**: `20.30` and `20:30` both occur → `HH:MM`, zero-padded, 24-hour.
   - **Resolve** each day code to an absolute ISO date from `weekStart`.
   - **Dubbing attaches per screening**, not per string — one `show_info` can yield both dubbed and non-dubbed screenings (MASTER.md §4.5).
3. Day codes to recognise, after diacritic stripping and uppercasing: `ΠΕΜ`, `ΠΑΡ`, `ΣΑΒ`, `ΚΥΡ`, `ΔΕΥ`, `ΤΡΙ`, `ΤΕΤ`. Accept both 3-letter and full forms (`ΠΕΜΠΤΗ`).
4. **Degrade, never throw.** Any segment that cannot be understood goes into `unparsed` and parsing continues with the rest. A total failure returns `{ screenings: [], unparsed: [input] }`. Wrap the whole body in `try/catch` as a final guard.
5. **`parse-showinfo.test.ts`** — hand-written cases, each asserting the exact expected output:
   - `Πέμ έως Κυρ & Τετ: 20.30` → 5 dates, one time each.
   - `Πέμ έως Κυρ & Τετ: 20.30, Δευ: 17:10, 20:30` → 5 + 2 screenings.
   - `(Μεταγλωττισμένο) Πέμ έως Τετ: 17.00` → 7 screenings, all `dubbed: true`.
   - `Πέμ έως Τετ: 18:15, 21:00` → 14 screenings.
   - `Σάβ, Κυρ: 11:20, 14:15, 17:00` → 6 screenings.
   - `Σάβ, Κυρ: 11:20, 14:15, Δευ: 20:30` → two days in the first segment and one in the second, proving all three comma roles.
   - `Πέμ: 18:00, 20:00 (Μεταγλωττισμένο)` → first time not dubbed, second time dubbed.
   - `Πέμ: 18:00 (Dolby Atmos), 20:00` → format only on 18:00; `(Dolby Atmos) Πέμ: 18:00, 20:00` → format on both.
   - Both `;` variants from the fixture.
   - `Σαβ` and `Σάβ` produce identical output.
   - The documented malformed case `(Μεταγλωττισμένο) Πέμ έως Τετ: Σάβ, Κυρ: 17.00` → yields `{ΣΑΒ, ΚΥΡ}` screenings and does not throw.
   - `''`, `'   '`, `'γεια σου'`, and a 5000-character string all return without throwing.
   - A range wrapping the week boundary (`Κυρ έως Τρι`) resolves to the correct four dates.

## Acceptance criteria

- [ ] `npm test` passes; every case above is present.
- [ ] `parseShowInfo` **cannot throw** for any string input — verify with 1000 random mutations of fixture strings.
- [ ] Running it over every row in `scripts/fixtures/flix-sample.json` yields ≥1 screening, including both malformed `;` cases; malformed syntax may populate `unparsed` but has no yield exemption.
- [ ] `npm run check` reports 0 errors.

## Do not

- Do not return day-of-week codes. Output is **absolute dates only** (MASTER.md §4.1).
- Do not throw, ever.
- Do not add a parser-generator or regex library.
- Do not silently drop an unrecognised segment — it must appear in `unparsed`.
- Do not assume the week starts Monday. It starts **Thursday**.
