const appRoot     = require('app-root-path');
const winston     = require('winston');
const { format }  = require('winston');
const { combine, timestamp, label, printf } = format;

const MAX_FILE_SIZE = 104857600; // 100 MB;
const MAX_FILES     = 20;

const myFormat = printf((info) => {
  if (info instanceof Error) {
    return `${info.timestamp}.[${info.label}].${info.level}: ${info.message}. Stack: ${info.stack}. Full JSON: ${JSON.stringify(info, null, 2)}`;
  }

  return `${info.timestamp}.[${info.label}].${info.level}: ${JSON.stringify(info.message)}`;
});

const options = {
  file: {
    level: 'error',
    filename: `${appRoot}/logs/app_error.log`,
    json: false,
    maxsize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    colorize: false,
  },
  file_info: {
    level: 'info',
    filename: `${appRoot}/logs/app_combined.log`,
    json: false,
    maxsize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
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
    new winston.transports.File(options.file_info),
  ]
});

logger.stream = {
  write: function(message, encoding) {
    logger.info(message);
  },
};

module.exports = logger;
