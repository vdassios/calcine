# Task 08 — Accessibility and CLS verification

**Depends on:** 04, 05, 06, 07. **Read:** MASTER.md §6 (Accessibility baseline), §10; DESIGN.md §§7, 10.

## Goal

Prove the four a11y requirements and the zero-CLS claim hold across the assembled UI, and fix what does not. This is a verification task: expect to find and fix defects, not to build features.

## Files

Create: `src/lib/components/LiveRegion.svelte`, `docs/verification-08.md`.
Modify only if a check fails: `src/routes/+page.svelte`, `src/lib/strings.ts`, `src/lib/styles/base.css`, and `src/lib/components/{AppHeader,AppFooter,ThemeToggle,FilmGrid,FilmTile,PosterPlaceholder,FilterBar,DaySelector,CinemaPanel,StalenessBanner}.svelte`. Do not modify `tokens.css`.

## Steps

1. **`LiveRegion.svelte`** — prop `count: number`. A visually-hidden `<div role="status" aria-live="polite" aria-atomic="true">` announcing the result count in Greek from `strings.ts`. Use the standard visually-hidden class (`position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap;`) — **not** `display: none`, which is not announced. Mount it in `+page.svelte` fed by the filtered film count.
2. **Keyboard audit.** With the mouse unplugged, confirm: Tab reaches search → chips → day chips → dropdowns (desktop) → every tile, in visual order; Enter and Space open a tile; focus moves into the panel; `Esc` closes it; focus returns to the originating tile; Tab never lands on a hidden or off-screen element. Fix any failure.
3. **Focus-visible audit.** Every interactive element shows the ring from DESIGN.md §7 in **both themes**, with ≥3:1 contrast against its background. Fix any element with `outline: none` and no replacement.
4. **Contrast audit.** Using DevTools, measure every text/background pairing in both themes against the floors in DESIGN.md §2 (body ≥7:1, muted ≥4.5:1). Record every measurement in `docs/verification-08.md`. Report — do not silently change — any token that fails; token changes belong to DESIGN.md.
5. **Responsive/theme matrix.** At **360px, 640px, 900px, and 1280px**, verify both themes, keyboard order, panel breakpoint behavior, touch targets, and layout against DESIGN.md. At every width audit that CSS values come from DESIGN.md and that no invented colour, size, radius, duration, or font weight exists.
6. **CLS audit.** At all four widths, DevTools Performance with Slow 3G and 4× CPU throttle. Record: cold load; typing 8 characters into search one at a time; opening and closing a panel; toggling the theme; switching days. Assert **CLS = 0** for each. Note the measured value for each scenario in `docs/verification-08.md`.
7. **Network audit.** With the Network tab open and filtered to XHR/Fetch, perform every interaction above and confirm **zero requests** after initial load. Record the result.
8. **Reduced motion.** At each width, enable "Emulate prefers-reduced-motion" and confirm the sheet appears without animation and nothing else moves.
9. **Touch targets.** Measure every interactive element at all four widths; all must be ≥44×44px.
10. **Dark reload and assistive technology.** At each width reload with dark persisted and verify no light flash. With VoiceOver on macOS or NVDA on Windows, verify labels, result-count announcements, exact mobile dialog naming, modal containment, and that CSS-hidden desktop controls are not announced below 900px.
11. Write `docs/verification-08.md` with the complete viewport/theme matrix and a table per audit: check, result, measured value, and the fix applied if any.

## Acceptance criteria

- [ ] All 9 named audits plus the verification record are complete at 360/640/900/1280px and both themes, with actual measured values rather than assertions.
- [ ] Every audit passes, or a failure is documented with the specific token or spec gap it requires.
- [ ] `npm test` and `npm run check` still pass.
- [ ] Result count is announced when filters change (verify with VoiceOver on macOS or NVDA on Windows).

## Do not

- Do not change any token value in `tokens.css` — report contrast failures instead.
- Do not add an a11y linter or automated audit dependency; these checks are manual and observational.
- Do not add `aria-live` to the grid itself — only the dedicated `LiveRegion`.
- Do not claim a value you did not measure.
