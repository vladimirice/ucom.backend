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
    "import/prefer-default-export": false,
  },
  "overrides": [
    {
      "files": ["*.ts"],
      "rules": {
        "no-unused-vars": "off",
        "no-undef": "off",
        "operator-linebreak": "off",
        "camelcase": "off",
        "no-restricted-syntax": "off",
        "no-param-reassign": "off",
        "security/detect-object-injection": "off",
        "no-multi-spaces": "off",
        "no-await-in-loop": "off",
        "key-spacing": "off",
        "sonarjs/no-duplicate-string": "off",
        "jest/no-disabled-tests": "off",
        "semi-style": "off",
        "jest/valid-expect": "off",
        "no-bitwise": "off",
        "no-prototype-builtins": "off",
        "no-continue": "off",
        "max-len": "off",
      }
    }
  ]
};