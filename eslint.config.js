import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

/**
 * Simulation déterministe : dans `core` et `label-tycoon`, aucune source non déterministe
 * (hasard, horloge) et aucune dépendance à l'interface ou au navigateur. Les tests sont exemptés
 * (les bancs de performance ont besoin d'une horloge).
 */
const NON_DETERMINISTIC =
  "Interdit dans la simulation : source non déterministe. Passe par le RNG de l'état.";
const BROWSER_ONLY =
  'Interdit dans la simulation : API du navigateur. La simulation doit tourner sans DOM.';

const simulationRules = {
  'no-restricted-globals': [
    'error',
    ...['window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'indexedDB'].map(
      (name) => ({ name, message: BROWSER_ONLY }),
    ),
    ...['performance', 'crypto', 'setTimeout', 'setInterval', 'requestAnimationFrame', 'fetch'].map(
      (name) => ({ name, message: NON_DETERMINISTIC }),
    ),
  ],
  'no-restricted-properties': [
    'error',
    { object: 'Math', property: 'random', message: NON_DETERMINISTIC },
    { object: 'Date', property: 'now', message: NON_DETERMINISTIC },
    { object: 'performance', property: 'now', message: NON_DETERMINISTIC },
    { object: 'crypto', property: 'getRandomValues', message: NON_DETERMINISTIC },
    { object: 'crypto', property: 'randomUUID', message: NON_DETERMINISTIC },
  ],
  'no-restricted-syntax': [
    'error',
    { selector: "NewExpression[callee.name='Date']", message: NON_DETERMINISTIC },
    { selector: "CallExpression[callee.name='Date']", message: NON_DETERMINISTIC },
  ],
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        { group: ['react', 'react-dom', 'react-dom/*', 'react-router*'], message: BROWSER_ONLY },
        { group: ['node:*', 'fs', 'path', 'os', 'child_process'], message: NON_DETERMINISTIC },
      ],
    },
  ],
};

export default tseslint.config(
  { ignores: ['**/dist', '**/node_modules', '**/coverage'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
  {
    files: ['packages/core/src/**/*.ts', 'packages/label-tycoon/src/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: simulationRules,
  },
  {
    files: ['*.{js,ts}', 'apps/web/*.{js,ts}', 'packages/*/*.{js,ts}'],
    languageOptions: { globals: { ...globals.node } },
  },
);
