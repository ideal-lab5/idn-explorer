module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  printWidth: 100,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'avoid',
  plugins: [
    'prettier-plugin-organize-imports',
    'prettier-plugin-tailwindcss',
  ],
  organizeImportsSkipDestructiveCodeActions: true,
};
