const express = require('express');

const imagesRouter = require('./router/uploader-images-router');

const ApiErrorAndLoggingHelper = require('../api/helpers/api-error-and-logging-helper');

const app = express();
const apiV1Prefix = '/api/v1';

const { ApiLoggerStream, ApiLogger } = require('../../config/winston');

app.use(express.json());
app.use(`${apiV1Prefix}/images`, imagesRouter);

// #security - very weak origin policy
// @ts-ignore
app.use((req, res, next) => {
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // Request headers you wish to allow
  res.setHeader(
    'Access-Control-Allow-Headers',
    'content-type,Authorization',
  );

  // Pass to next layer of middleware
  next();
});

ApiErrorAndLoggingHelper.initAllForApp(app, ApiLogger, ApiLoggerStream);

export {
  app,
};
