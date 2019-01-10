const { getConfig } = require('./test/template-config');

let filePattern = process.env.test_pattern || null;
if (filePattern) {
  filePattern += '.*';
}

const testsFolder = process.env.test_dir || null;

module.exports = getConfig(filePattern, testsFolder);
