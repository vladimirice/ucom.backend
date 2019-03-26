
const ROOT_TEST_FOLDER = './test/integration';

function getConfig(testRegex, testsFolder = null) {
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
