import js from '@eslint/js'
import ts from 'typescript-eslint'
import svelte from 'eslint-plugin-svelte'
import prettier from 'eslint-config-prettier/flat'
import globals from 'globals'

export default ts.config(
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,

  // Must stay last among the rule-bearing configs: switches off every stylistic
  // rule Prettier owns, so the two never disagree about formatting.
  prettier,
  svelte.configs.prettier,

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },

  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
      },
    },
  },

  {
    ignores: [
      '.svelte-kit/',
      'build/',
      '.build/',
      'node_modules/',
      'static/posters/',
      'src/lib/data/schedule.json',
    ],
  }
)
