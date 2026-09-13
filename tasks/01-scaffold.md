# Task 01 — Project scaffold

**Depends on:** nothing. **Read:** MASTER.md §7, §8.

## Goal

A running SvelteKit 5 + TypeScript project with static adapter and Vitest, and nothing else.

## Files

Create: `package.json`, `package-lock.json`, `svelte.config.js`, `vite.config.ts`, `vitest-setup.ts`, `tsconfig.json`, `.gitignore`, `.npmrc`, `.github/workflows/.gitkeep`, `src/app.html`, `src/app.d.ts`, `src/routes/+layout.ts`, `src/routes/+page.svelte`, `static/.gitkeep`.

## Steps

1. Scaffold with `npm create svelte@latest . -- --template skeleton --types typescript --no-add-ons`, or create the files by hand to the same effect. Use **npm** (not pnpm or yarn) — a committed `package-lock.json` is required by task 18.
2. Install exactly these, no others:
   - dependencies: none
   - devDependencies: `@sveltejs/kit`, `@sveltejs/adapter-static`, `@sveltejs/vite-plugin-svelte`, `svelte` (^5), `svelte-check`, `typescript`, `vite`, `vitest`, `@testing-library/svelte`, `@testing-library/jest-dom`, `jsdom`
3. `svelte.config.js` — use `@sveltejs/adapter-static` with `fallback: undefined`, `strict: true`.
4. `src/routes/+layout.ts` — export `export const prerender = true;` and `export const ssr = true;`.
5. `vite.config.ts` — add a `test` block: `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./vitest-setup.ts']`. Create `vitest-setup.ts` importing `@testing-library/jest-dom/vitest`.
6. `tsconfig.json` — extend `./.svelte-kit/tsconfig.json`, set `"strict": true`.
7. `src/routes/+page.svelte` — a single `<h1>Calcine</h1>`. Placeholder only; task 03 replaces it.
8. `package.json` scripts, exactly: `dev`, `build`, `preview`, `check` (`svelte-check --tsconfig ./tsconfig.json`), `test` (`vitest run --passWithNoTests`), `test:watch` (`vitest`). Task 03 or the first task that adds a test may remove `--passWithNoTests`.
9. `.gitignore` must include `node_modules`, `.svelte-kit`, `build`, `.env`, `.DS_Store`.

## Acceptance criteria

- [ ] `npm install` completes with no peer-dependency errors.
- [ ] `npm run build` produces a `build/` directory containing `index.html`.
- [ ] `npm run check` reports 0 errors.
- [ ] `npm test` runs and reports "no test files found" without erroring.
- [ ] `npm run dev` serves a page showing "Calcine".
- [ ] `.github/workflows/` exists for task 18; no workflow is implemented yet.

## Do not

- Do not add Tailwind, UnoCSS, PostCSS, or any CSS framework. Styles are hand-written per DESIGN.md.
- Do not add a component library, icon package, or font package.
- Do not add ESLint or Prettier configs.
- Do not write any styles yet.
