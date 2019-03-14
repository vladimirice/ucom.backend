const DEFAULT_TEST_REGEX = '.test.ts$';

const { getConfig } = require('./test/template-config');

let prefix = process.env.test_pattern || '';
if (prefix !== '') {
  prefix = process.env.to_exclude ? `^((?!${prefix}).)*` : `${prefix}.*`;
}

const testsFolder = process.env.test_dir || null;
const pattern = `${prefix}${DEFAULT_TEST_REGEX}`;

module.exports = getConfig(pattern, testsFolder);
