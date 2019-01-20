const appRoot = require('app-root-path');
const Sentry = require('winston-sentry-raven-transport');

const winston = require('winston');
const { format } = require('winston');

const {
  combine, timestamp, label, printf,
} = format;

const { stringify } = require('flatted/cjs');

const MAX_FILE_SIZE = 104857600; // 100 MB;
const MAX_FILES = 30;

const LOGGER__API = 'api';
const LOGGER_CONSUMER = 'consumer';
const LOGGER_WORKER = 'worker';

const LOGGERS_ALL = [
  LOGGER__API,
  LOGGER_CONSUMER,
  LOGGER_WORKER,
];

const myFormat = printf((info) => {
  const nodeEnv = process.env.NODE_ENV;

  if (info instanceof Error) {
    return `${info.timestamp}.[${nodeEnv}].[${info.label}].${info.level}: ${info.message}. Stack: ${info.stack}. Full JSON: ${stringify(info)}`;
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
  sentry: {
    dsn: 'http://32db371651644b0da6d582d2c71d05c3@sentry.u.community/1',
    level: 'error',
  },
};

// noinspection JSValidateTypes
const transports = [
  new winston.transports.File(options.file_error),
  new winston.transports.File(options.file_combined),
];

if (process.env.NODE_ENV === 'production') {
  transports.push(
    new Sentry(options.sentry),
  );
}

function getFormat(labelToSet) {
  return combine(
    label({ label: labelToSet }),
    timestamp(),
    myFormat,
  );
}

for (let i = 0; i < LOGGERS_ALL.length; i += 1) {
  // eslint-disable-next-line security/detect-object-injection
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
  write(message) {
    winston.loggers.get(LOGGER__API).info(message);
  },
};

module.exports = {
  ApiLogger: winston.loggers.get(LOGGER__API),
  ConsumerLogger: winston.loggers.get(LOGGER_CONSUMER),
  WorkerLogger: winston.loggers.get(LOGGER_WORKER),

  ApiLoggerStream,
};
