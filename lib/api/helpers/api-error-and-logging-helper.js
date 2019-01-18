"use strict";
const morgan = require('morgan');
const helmet = require('helmet');
const errorMiddleware = require('../../../lib/api/error-middleware');
const { BadRequestError } = require('../../../lib/api/errors');
require('express-async-errors');
class ApiErrorAndLoggingHelper {
    /**
     *
     * @param {Object} app
     * @param {Object} logger
     * @param {Object} loggerStream
     * @return {Function[]}
     */
    static initAllForApp(app, logger, loggerStream) {
        app.use(helmet());
        app.use(morgan('combined', { stream: loggerStream }));
        process.on('uncaughtException', (ex) => { logger.error(ex); });
        process.on('unhandledRejection', (ex) => { throw ex; });
        app.use(createErrorIfNoRoute);
        app.use(errorMiddleware);
    }
}
// @ts-ignore
function createErrorIfNoRoute(req, res, next) {
    const err = new BadRequestError('Not found', 404);
    next(err);
}
module.exports = ApiErrorAndLoggingHelper;
