const express     = require('express');
const morgan      = require('morgan');
const createError = require('http-errors');

const { ApiLoggerStream, ApiLogger }  = require('../../config/winston');
const errorMiddleware                 = require('../../lib/api/error-middleware');

const StaticRendererService = require('./service/static-renderer-service');

const app = express();

process.on('uncaughtException', (ex) => { ApiLogger.error(ex); });
process.on('unhandledRejection', (ex) => { throw ex; });

app.use(morgan('combined', { stream: ApiLoggerStream }));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.use(errorMiddleware);

app.get('*', async (req, res) => {
  const host = req.headers.host;
  const originalUrl = req.params[0];

  const html = await StaticRendererService.getHtml(host, originalUrl);

  return res.send(html);
});

module.exports = app;
