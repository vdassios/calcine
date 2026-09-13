# Task 02 — Design tokens and theme toggle

**Depends on:** 01. **Read:** DESIGN.md §§2, 3, 4, 5, 6, 7 in full.

## Goal

Every design token exists as a CSS custom property, and the light/dark toggle works with no flash on load.

## Files

Create: `src/lib/styles/tokens.css`, `src/lib/styles/base.css`, `src/lib/theme.ts`, `src/lib/components/ThemeToggle.svelte`, `src/lib/components/ThemeToggle.test.ts`.
Modify: `src/app.html`, `src/routes/+layout.svelte` (create if absent).

## Steps

1. **`tokens.css`** — transcribe the `:root` and `[data-theme='dark']` blocks from DESIGN.md §2 **exactly, character for character**. Then add the space, radius, shadow, duration and easing tokens from §4, the font and type-scale tokens from §3, and the breakpoint values from §5 as comments (CSS custom properties do not work in media queries — hardcode `640px` / `900px` / `1200px` in the queries themselves).
2. **`base.css`** — `box-sizing: border-box` reset, `html { scrollbar-gutter: stable; }`, `body { background: var(--bg); color: var(--text); font-family: var(--font-sans); font-size: var(--text-base); }`, the `:focus-visible` rule from DESIGN.md §7, and the `prefers-reduced-motion` block from §4. The stable scrollbar gutter prevents modal scroll lock in task 06 from shifting the page. Import both stylesheets from `+layout.svelte`.
3. **`src/app.html`** — insert the no-flash inline script from DESIGN.md §6 into `<head>`, **before** any stylesheet or `%sveltekit.head%`. Copy it verbatim. Add `<meta name="color-scheme" content="light dark">`. Set `<html lang="el">`.
4. **`theme.ts`** — export exactly:
   ```ts
   export type Theme = 'light' | 'dark';
   export const THEME_KEY = 'calcine-theme';
   export function getTheme(): Theme;      // reads the data-theme attribute on <html>
   export function setTheme(t: Theme): void; // sets the attribute AND writes localStorage
   export function toggleTheme(): Theme;     // flips, persists, returns the new value
   ```
   All localStorage access must be wrapped in `try/catch` (Safari private mode throws).
5. **`ThemeToggle.svelte`** — a `<button>` per DESIGN.md §6 "Toggle control". Two inline SVG icons (sun, moon), `stroke="currentColor"`, `stroke-width="1.5"`, `width="20" height="20"`, `fill="none"`. Show the icon for the theme that clicking will switch **to**. `aria-label` switches with state using the exact Greek strings in DESIGN.md §6. Cross-fade icons on `opacity` over `--dur-fast`.
6. **`ThemeToggle.test.ts`** — assert: renders a button with an accessible name; clicking sets `data-theme="dark"` on `document.documentElement`; clicking again sets `"light"`; the `aria-label` changes between the two.

## Acceptance criteria

- [ ] `npm test` passes.
- [ ] Toggling switches the whole page between the two palettes.
- [ ] Reloading with dark active shows **no white flash** — verify with DevTools throttled to Slow 3G.
- [ ] A fresh profile with OS dark mode gets dark; a fresh profile with OS light mode gets light.
- [ ] `grep -rnE '#[0-9A-Fa-f]{3,8}' src --include='*.svelte' --include='*.ts'` returns nothing (all hex lives in `tokens.css`; SVG uses `currentColor`).
- [ ] The button hit area measures at least 44×44px.
- [ ] CSS uses only font weights 400, 500, and 600; no 300-or-lighter or 700-or-heavier declaration exists.

## Do not

- Do not use emoji for the icons.
- Do not animate the colour change itself — only the icon opacity.
- Do not make the inline script a module, deferred, or an import.
- Do not add a "system" third option. There are exactly two states.
- Do not invent tokens not listed in DESIGN.md.
- Do not use font weights outside 400, 500, and 600.
