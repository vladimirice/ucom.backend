const express = require('express');
const cookieParser = require('cookie-parser');

const redirectRouter = require('../router/redirect-router');

const ApiErrorAndLoggingHelper = require('../../api/helpers/api-error-and-logging-helper');

const app = express();
app.use(cookieParser());

const { ApiLoggerStream, ApiLogger } = require('../../../config/winston');

ApiErrorAndLoggingHelper.initBeforeRouters(app, ApiLogger, ApiLoggerStream);

app.use('/', redirectRouter);

ApiErrorAndLoggingHelper.initErrorHandlers(app);

export {
  app,
};
