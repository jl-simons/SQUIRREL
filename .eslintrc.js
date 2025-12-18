module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', 'jsx-a11y', 'import'],
  rules: {
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'warn', // Warn about missing prop types
    'no-unused-vars': 'warn', // Warn about unused variables
    'jsx-a11y/alt-text': 'error', // Require alt text for images
    'jsx-a11y/anchor-has-content': 'error', // Require content in anchors
    'jsx-a11y/aria-props': 'error', // Validate ARIA props
    'jsx-a11y/aria-proptypes': 'error', // Validate ARIA prop values
    'jsx-a11y/aria-unsupported-elements': 'error', // Enforce ARIA state and property values
    'jsx-a11y/role-has-required-aria-props': 'error', // Enforce that elements with ARIA roles have required props
    'jsx-a11y/role-supports-aria-props': 'error', // Enforce that elements with ARIA roles have allowed props
    'jsx-a11y/tabindex-no-positive': 'error', // Enforce tabIndex value is not greater than zero
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};