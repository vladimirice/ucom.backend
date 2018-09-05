const appRoot = require('app-root-path');
const winston = require('winston');
const { format } = require('winston');
const { combine, timestamp, label, printf } = format;

const myFormat = printf((info) => {
  return `${info.timestamp}.[${info.label}].${info.level}: ${info.message}. Stack: ${info.stack}`;
});

const options = {
  file: {
    level: 'error',
    filename: `${appRoot}/logs/app.log`,
    json: false,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
  },
};

const logger = winston.createLogger({
  format: combine(
    label({ label: 'general' }),
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.File(options.file),
  ]
});

logger.stream = {
  write: function(message, encoding) {
    logger.info(message);
  },
};

module.exports = logger;
