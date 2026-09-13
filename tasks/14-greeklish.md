# Task 14 — Greeklish matcher

**Depends on:** 03. **Read:** MASTER.md §6 "Greeklish matching" in full, including both transliteration tables, and §2.17 (homoglyph contamination).

## Goal

Match a Latin, Greek, or mixed query against Greek text, permissively, with no precomputation shipped in the dataset.

## Files

Create: `src/lib/homoglyphs.ts`, `src/lib/homoglyphs.test.ts`, `src/lib/greeklish.ts`, `src/lib/greeklish.test.ts`.

## Steps

1. **`homoglyphs.ts`** — shared by this task and task 17, so the two never drift. Export exactly:
   ```ts
   export const HOMOGLYPHS: Record<string, string>;
   export function deglyph(s: string): string;
   ```
   - `HOMOGLYPHS` is exactly this map, no more and no fewer entries:
     `Α→A  Β→B  Ε→E  Ζ→Z  Η→H  Ι→I  Κ→K  Μ→M  Ν→N  Ο→O  Ρ→P  Τ→T  Υ→Y  Χ→X`
   - These are the **uppercase** Greek letters that are visually identical to Latin ones. flix's English titles contain them: `Βreakfast at Tiffany's` starts with Greek beta, `L'Εclisse` contains Greek epsilon (MASTER.md §2.17). A Latin-script search for `breakfast` cannot match a string whose first letter is Greek.
   - **`deglyph` applies the map only when the string is predominantly Latin.** Count Greek letters (`U+0370–U+03FF`, `U+1F00–U+1FFF`) and ASCII letters; substitute only when ASCII letters strictly outnumber Greek ones. Without this guard, genuinely Greek titles would be mangled.
   - Lowercase Greek homoglyphs (`ο`, `α`, `ν`) are **deliberately not included** — only uppercase contamination is observed in live data, and a wider map raises the risk of damaging real Greek text. Add entries only when a real example appears.

2. Export exactly from `greeklish.ts`:
   ```ts
   export function normalize(s: string): string;
   export function compilePattern(word: string): RegExp;
   export function matchesQuery(pattern: RegExp, query: string): boolean;
   export function compileIndex(text: string): RegExp[];   // one pattern per word
   export function matchesText(index: RegExp[], query: string): boolean;
   ```
3. **`normalize`** — in this exact order:
   1. **`deglyph(s)` first.** This must run **before lowercasing**: the map covers uppercase Greek only, and lowercasing turns `Β` into `β`, which is not in the map and can no longer be repaired.
   2. Lowercase.
   3. Strip Greek diacritics.
   4. Map final sigma `ς` → `σ`.
   5. Collapse whitespace.

   `normalize` is applied to **both** the indexed text and the incoming query, so a homoglyph on either side is repaired symmetrically.
4. **Transliteration tables** — transcribe both tables from MASTER.md §6 **exactly**. Digraphs first (`ου`, `αι`, `ει`, `οι`, `υι`, `τσ`, `αυ`, `ευ`, `μπ`, `ντ`, `γκ`/`γγ`, `τζ`), matched **longest-first**, then single letters. Do not add, remove, or reassign any variant — the tables encode observed real-world usage, not a scheme.
5. **`compilePattern`** — build the nested-optional form from MASTER.md §6:
   ```
   ^(?:a₁(?:a₂(?:a₃(?:…)?)?)?)?$
   ```
   where each `aₙ` is an alternation of every accepted Latin rendering of that grapheme, **plus the Greek grapheme itself** so a Greek-typed query also matches. This matches any **prefix** of the word under any transliteration variant. Escape every alternative for regex safety.
6. **`compileIndex`** — normalise, split on whitespace and `-`, and compile one pattern per word. **Word-level prefix matching, not substring** (MASTER.md §6).
7. **Compilation happens in the browser at load.** Patterns must **not** be written into `schedule.json` — they would plausibly run 100–300 KB against a ~14 KB dataset (MASTER.md §6, §13).
8. **All matching goes through `matchesQuery`.** Callers must never test a regex directly, so a linear character-walk matcher can replace the regex behind this boundary later.
9. **`greeklish.test.ts`** — table-driven, asserting **permissiveness, not exactness**. A false positive costs one glance; a miss costs the result entirely. Required cases:
   - `patrida`, `patrhda`, `Πατρίδα`, `patrid`, `PATRIDA` all match `Πατρίδα`.
   - `8essaloniki`, `thessaloniki`, `uessaloniki`, `Θεσσαλονίκη` all match `Θεσσαλονίκη`.
   - `psyxo`, `psixo`, `4yxw`, `psyxw` all match `Ψυχώ`.
   - `kypseli`, `kipseli`, `kupseli` all match `ΚΥΨΕΛΗ`.
   - Multi-word: `nana cinemax` matches `ΝΑΝΑ CINEMAX`; `cinemax` alone matches (any word may match).
   - Accent-insensitive: `Σάβ` and `Σαβ` behave identically.
   - Empty query matches everything.
   - A query longer than the word does not match.
   - Latin-script text (`Michael`) matches a Latin-script title.
   - **Homoglyph repair** — these use real strings from live flix data:
     - `eclisse` and `Eclisse` match the indexed title `L'Εclisse` (Greek epsilon inside a Latin word).
     - `breakfast` and `tiffany` match `Βreakfast at Tiffany's` (leading Greek beta).
     - `Πατρίδα` is **unchanged** by `normalize` apart from casing and accents — a predominantly Greek string must never be homoglyph-mapped.
     - `Το Καλοκαίρι της Κάρμεν` is unaffected, and `kalokairi` still matches it via the greeklish tables.
10. **`homoglyphs.test.ts`** — `deglyph("Βreakfast at Tiffany's")` → `"Breakfast at Tiffany's"`; `deglyph("L'Εclisse")` → `"L'Eclisse"`; `deglyph("Πολύ Κοριτσίστικο Ονομα το Πάττυ")` is unchanged; `deglyph("Bashu, ο Μικρός Ξένος")` is unchanged (Greek letters outnumber Latin); `HOMOGLYPHS` has exactly 14 entries.

11. **Performance test**: compiling 400 patterns takes under 20 ms, and 400 `matchesText` calls take under 5 ms. Assert with `performance.now()`.

## Acceptance criteria

- [ ] `npm test` passes; every case above present.
- [ ] `npm run check` reports 0 errors.
- [ ] `grep -rn 'pattern' src/lib/data/` finds nothing — no patterns in the dataset.
- [ ] No caller tests a `RegExp` outside `matchesQuery`.
- [ ] A Latin query matches a homoglyph-contaminated Latin title, and a Greek title is untouched by `deglyph`.
- [ ] `HOMOGLYPHS` is defined once, in `homoglyphs.ts`, and is not duplicated anywhere (task 17 imports it).
- [ ] Both performance assertions pass.

## Do not

- Do not implement ISO 843 — real greeklish is many-to-many and ad hoc.
- Do not resolve the `x` = χ-or-ξ ambiguity; both list `x`, which is the point.
- Do not precompute patterns into any committed file.
- Do not use substring matching.
- Do not add a fuzzy-matching library (Fuse.js, fuzzysort).
- Do not apply `deglyph` unconditionally — the predominantly-Latin guard is mandatory.
- Do not run `deglyph` after lowercasing.
- Do not add lowercase entries to `HOMOGLYPHS` without a real observed example.
- Do not duplicate the homoglyph map in `greeklish.ts`.
