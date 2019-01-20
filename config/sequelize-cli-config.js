const config = require('config');

const configKey = process.env.NODE_ENV || 'development';

const result = {};
// eslint-disable-next-line
result[configKey] = config.get('db');

module.exports = {
  ...result,
};
