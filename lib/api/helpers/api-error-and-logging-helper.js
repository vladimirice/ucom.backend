const morgan      = require('morgan');
const createError = require('http-errors');

const errorMiddleware                 = require('../../../lib/api/error-middleware');

class ApiErrorAndLoggingHelper {
  /**
   *
   * @param {Object} app
   * @param {Object} Logger
   * @param {Object} LoggerStream
   * @return {Function[]}
   */
  static initAllForApp(app, Logger, LoggerStream) {
    app.use(morgan('combined', { stream: LoggerStream }));

    process.on('uncaughtException', (ex) => { Logger.error(ex); });
    process.on('unhandledRejection', (ex) => { throw ex; });

    app.use(errorMiddleware);
    app.use(createErrorIfNoRoute);
  }
}

function createErrorIfNoRoute(req, res, next) {
  next(createError(404));
}

module.exports = ApiErrorAndLoggingHelper;