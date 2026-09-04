import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactRefreshPlugin from 'eslint-plugin-react-refresh'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'

export default [
  { ignores: ['dist', 'eslint.config.js', '.prettierrc.cjs'] },
  js.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  ...tseslint.configs['flat/recommended-type-checked'],
  ...tseslint.configs['flat/stylistic-type-checked'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Only the long-standing, universally-applicable hooks rules. v7 of
      // this plugin folded in the React Compiler's much stricter (and
      // compiler-oriented) rule set — e.g. `react-hooks/refs` and
      // `react-hooks/immutability`, which flag the "latest ref" pattern and
      // mutating a `useMemo`'d PixiJS object from a `useTick` callback.
      // Both are the correct, documented way to integrate with an external
      // render loop (this is exactly what @pixi/react's own docs show), and
      // this project doesn't opt into the React Compiler, so those rules
      // would just be fighting the architecture on false positives.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // pixiGraphics' `draw` prop is a @pixi/react convenience prop, not a
      // DOM attribute — eslint-plugin-react doesn't know about it.
      'react/no-unknown-property': ['error', { ignore: ['draw'] }],

      // Personal customization
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-empty-function': [
        'error',
        { allow: ['arrowFunctions'] },
      ],
      'react/prop-types': 'off',
    },
  },
  prettierConfig,
]
