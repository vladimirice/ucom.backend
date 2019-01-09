const DEFAULT_TEST_REGEX = '(/__tests__/.*|(\\.|/)(test|spec))\\.((tsx?)|(js?))$';

function getConfig(regexPrefix = null, testsFolder = 'integration') {
  const testRegex = regexPrefix ?
    `${regexPrefix}${DEFAULT_TEST_REGEX}` : DEFAULT_TEST_REGEX;

  return {
    "roots": [
      `./${testsFolder}`
    ],
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },
    "testRegex": testRegex,
    "moduleFileExtensions": [
      "ts",
      "tsx",
      "js",
      "jsx",
      "json",
      "node"
    ],
  }
}

module.exports = {
  getConfig
};
