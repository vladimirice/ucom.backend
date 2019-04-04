"use strict";
const EnvHelper = require("../../common/helper/env-helper");
const morgan = require('morgan');
const helmet = require('helmet');
const errorMiddleware = require('../../../lib/api/error-middleware');
const { BadRequestError } = require('../../../lib/api/errors');
require('express-async-errors');
// @ts-ignore
function createErrorIfNoRoute(req, res, next) {
    const err = new BadRequestError('Not found', 404);
    next(err);
}
class ApiErrorAndLoggingHelper {
    /**
     *
     * @param {Object} app
     * @param {Object} logger
     * @param {Object} loggerStream
     * @return {Function[]}
     */
    static initBeforeRouters(app, logger, loggerStream) {
        app.use(helmet());
        app.use(morgan('combined', { stream: loggerStream }));
        process.on('uncaughtException', (ex) => { logger.error(ex); });
        process.on('unhandledRejection', (ex) => { throw ex; });
    }
    static initErrorHandlers(app) {
        app.use(createErrorIfNoRoute);
        app.use(errorMiddleware);
    }
    static initServerOrException(app, server) {
        const port = EnvHelper.getPortOrException();
        app.set('port', port);
        server.listen(port);
        server.on('error', ApiErrorAndLoggingHelper.httpServerOnError);
    }
    static httpServerOnError(error, port) {
        if (error.syscall !== 'listen') {
            throw error;
        }
        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                throw new Error(`Port ${port} requires elevated privileges`);
            case 'EADDRINUSE':
                throw new Error(`Port ${port} is already in use`);
            default:
                throw error;
        }
    }
}
module.exports = ApiErrorAndLoggingHelper;
