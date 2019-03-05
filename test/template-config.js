const DEFAULT_TEST_REGEX = '(/__tests__/.*|(\\.|/)(test|spec))\\.((tsx?)|(js?))$';
const ROOT_TEST_FOLDER = './test/integration';

function getConfig(regexPrefix = null, testsFolder = null) {
  const testRegex = regexPrefix
    ? `${regexPrefix}${DEFAULT_TEST_REGEX}` : DEFAULT_TEST_REGEX;

  const rootFolder = testsFolder
    ? `${ROOT_TEST_FOLDER}/${testsFolder}` : ROOT_TEST_FOLDER;

  return {
    roots: [
      rootFolder,
    ],
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    testRegex,
    moduleFileExtensions: [
      'ts',
      'tsx',
      'js',
      'jsx',
      'json',
      'node',
    ],
  };
}

module.exports = {
  getConfig,
};
