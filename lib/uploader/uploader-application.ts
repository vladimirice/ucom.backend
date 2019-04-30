import CorsHelper = require('../api/helpers/cors-helper');

const express = require('express');
const imagesRouter = require('./router/uploader-images-router');

const ApiErrorAndLoggingHelper = require('../api/helpers/api-error-and-logging-helper');
const diContainerMiddleware = require('../api/di-container-middleware');

const app = express();
const apiV1Prefix = '/api/v1';

require('../auth/passport');

const { ApiLoggerStream, ApiLogger } = require('../../config/winston');

app.use(diContainerMiddleware);

CorsHelper.addRegularCors(app);

ApiErrorAndLoggingHelper.initBeforeRouters(app, ApiLogger, ApiLoggerStream);

app.use(`${apiV1Prefix}/images`, imagesRouter);

ApiErrorAndLoggingHelper.initErrorHandlers(app);

export {
  app,
};
