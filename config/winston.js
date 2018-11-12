const appRoot     = require('app-root-path');
const winston     = require('winston');
const { format }  = require('winston');
const { combine, timestamp, label, printf } = format;

const MAX_FILE_SIZE = 104857600; // 100 MB;
const MAX_FILES     = 30;

const LOGGER__API     = 'api';
const LOGGER_CONSUMER = 'consumer';

const LOGGERS_ALL = [
  LOGGER__API,
  LOGGER_CONSUMER
];

const myFormat = printf((info) => {
  if (info instanceof Error) {
    return `${info.timestamp}.[${info.label}].${info.level}: ${info.message}. Stack: ${info.stack}. Full JSON: ${JSON.stringify(info, null, 2)}`;
  }

  return `${info.timestamp}.[${info.label}].${info.level}: ${JSON.stringify(info.message)}`;
});

const options = {
  file_error: {
    level: 'error',
    filename: `${appRoot}/logs/app_error.log`,
    json: false,
    maxsize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    colorize: false,
  },
  file_combined: {
    level: 'info',
    filename: `${appRoot}/logs/app_combined.log`,
    json: false,
    maxsize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    colorize: false,
  },
  test_console: {
    level: 'error',
    // handleExceptions: true,
    json: false,
    colorize: true,
  },
};

const transports = [
  new winston.transports.File(options.file_error),
  new winston.transports.File(options.file_combined),
];

function getFormat(labelToSet) {
  return combine(
    label({ label: labelToSet }),
    timestamp(),
    myFormat
  );
}

for (let i = 0; i < LOGGERS_ALL.length; i++) {
  const loggerName = LOGGERS_ALL[i];

  winston.loggers.add(loggerName, {
    format: getFormat(loggerName),
    transports,
  });

  if (process.env.NODE_ENV === 'test') {
    winston.loggers.get(loggerName).add(new winston.transports.Console(options.test_console));
  }
}

const ApiLoggerStream = {
  write: function(message) {
    winston.loggers.get(LOGGER__API).info(message);
  },
};

module.exports = {
  ApiLogger:      winston.loggers.get(LOGGER__API),
  ConsumerLogger: winston.loggers.get(LOGGER_CONSUMER),
  ApiLoggerStream
};