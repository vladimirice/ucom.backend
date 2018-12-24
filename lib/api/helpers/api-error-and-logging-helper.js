const morgan      = require('morgan');
const helmet      = require('helmet');

const errorMiddleware     = require('../../../lib/api/error-middleware');
const { BadRequestError } = require('../../../lib/api/errors');

require('express-async-errors');

class ApiErrorAndLoggingHelper {
  /**
   *
   * @param {Object} app
   * @param {Object} Logger
   * @param {Object} LoggerStream
   * @return {Function[]}
   */
  static initAllForApp(app, Logger, LoggerStream) {
    app.use(helmet());

    app.use(morgan('combined', { stream: LoggerStream }));

    process.on('uncaughtException', (ex) => { Logger.error(ex); });
    process.on('unhandledRejection', (ex) => { throw ex; });

    app.use(createErrorIfNoRoute);
    app.use(errorMiddleware);
  }
}

function createErrorIfNoRoute(req, res, next) {
  const err = new BadRequestError('Not found', 404);
  next(err);
}

module.exports = ApiErrorAndLoggingHelper;