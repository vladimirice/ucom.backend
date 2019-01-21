module.exports = {
  "parser": "@typescript-eslint/eslint-plugin/parser",
  "plugins": [
    "typescript",
    "security",
    "promise",
    "jest",
    "optimize-regex",
    "sonarjs",
  ],
  "extends": [
    "airbnb-base",
    "plugin:you-dont-need-lodash-underscore/compatible",
    "plugin:security/recommended",
    "plugin:promise/recommended",
    "plugin:jest/recommended",
    "plugin:node/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:sonarjs/recommended",
  ],
  "env": {
    "node": true,
    "jest/globals": true,
  },
  "rules": {
    "optimize-regex/optimize-regex": "warn",
    "node/no-unsupported-features/es-syntax": false,
    "eslint/no-use-before-define": false,
    "node/no-unpublished-require": false,
    "eslint/no-unused-vars": false,
    "import/no-unresolved": false,
  }
};