const express = require('express');

const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;
const imagesRouter = require('./router/uploader-images-router');

const ApiErrorAndLoggingHelper = require('../api/helpers/api-error-and-logging-helper');
const diContainerMiddleware = require('../api/di-container-middleware');

const app = express();
const apiV1Prefix = '/api/v1';

require('../auth/passport');

const { ApiLoggerStream, ApiLogger } = require('../../config/winston');

app.use(diContainerMiddleware);

// #security - very weak origin policy
// @ts-ignore
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:8080', 'https://staging.u.community', 'https://u.community'];

  const { origin } = req.headers;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  res.setHeader(
    'Access-Control-Allow-Headers',
    `content-type,Authorization,${CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB}`,
  );

  next();
});

ApiErrorAndLoggingHelper.initBeforeRouters(app, ApiLogger, ApiLoggerStream);

app.use(`${apiV1Prefix}/images`, imagesRouter);

ApiErrorAndLoggingHelper.initErrorHandlers(app);

export {
  app,
};
