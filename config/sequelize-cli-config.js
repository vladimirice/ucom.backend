const config = require('config');
const configKey = process.env.NODE_ENV || 'development';

let result = {};
result[configKey] = config.get('db');

console.log(result);

module.exports = {
  ...result
};
