import adapter from '@sveltejs/adapter-static'

/** @type {import('@sveltejs/kit').Config} */
export default {
  // Force runes mode for our own components, but leave dependencies alone:
  // a legacy Svelte library under node_modules must still compile. Svelte
  // invokes this per file, so returning `undefined` there means "auto-detect".
  compilerOptions: {
    runes: ({ filename }) =>
      filename.split(/[/\\]/).includes('node_modules') ? undefined : true,
  },
  kit: {
    adapter: adapter({
      fallback: undefined,
      strict: true,
    }),
  },
}
