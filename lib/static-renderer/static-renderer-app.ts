const express = require('express');
const app     = express();

const staticRendererService     = require('./service/static-renderer-service');
const apiErrorAndLoggingHelper  = require('../api/helpers/api-error-and-logging-helper');

const { ApiLoggerStream, ApiLogger }  = require('../../config/winston');

app.get('*', async (req, res) => {
  const host = req.headers.host;
  const originalUrl = req.params[0]; // fetch originalUrl without query string

  const html = await staticRendererService.getHtml(host, originalUrl);

  return res.send(html);
});

apiErrorAndLoggingHelper.initBeforeRouters(app, ApiLogger, ApiLoggerStream);

export = app;
