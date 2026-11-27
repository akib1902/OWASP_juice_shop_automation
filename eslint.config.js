/**
 * Static analysis is part of the framework, not an afterthought.
 *
 * WHY the playwright plugin: it encodes exactly the rules that keep a UI suite
 * honest — no `waitForTimeout`, no conditional logic in tests, no hard-coded
 * `.only`, no stray `expect` without `await`. Those lint errors map 1:1 to the
 * flake classes described in docs/STRATEGY.md.
 */
import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'reports/**', 'test-results/**', 'playwright-report/**'] },

  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      // Node globals for the runner plus browser globals, because some support
      // code runs inside the page (init scripts, localStorage helpers).
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
    },
  },

  {
    files: ['tests/**/*.js'],
    ...playwright.configs['flat/recommended'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Our fixtures are the entry point; specs never touch the browser directly.
      'playwright/no-conditional-in-test': 'error',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/no-eval': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      // An empty test is almost always a leftover during refactoring.
      'playwright/no-skipped-test': 'warn',
      // OFF BY DESIGN: assertions live in page objects (expectVisible,
      // expectRejected, expectTotal...). The rule only inspects the test body,
      // so it reports false positives for exactly the pattern we want.
      'playwright/expect-expect': 'off',
    },
  },

  prettier,
];
