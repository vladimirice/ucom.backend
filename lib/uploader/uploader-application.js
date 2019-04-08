"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const config = require('config');
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;
const imagesRouter = require('./router/uploader-images-router');
const ApiErrorAndLoggingHelper = require('../api/helpers/api-error-and-logging-helper');
const diContainerMiddleware = require('../api/di-container-middleware');
const app = express();
exports.app = app;
const apiV1Prefix = '/api/v1';
require('../auth/passport');
const { ApiLoggerStream, ApiLogger } = require('../../config/winston');
app.use(diContainerMiddleware);
app.use((req, res, next) => {
    const allowedOrigins = config.cors.allowed_origins;
    const { origin } = req.headers;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', `content-type,Authorization,${CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB}`);
    next();
});
ApiErrorAndLoggingHelper.initBeforeRouters(app, ApiLogger, ApiLoggerStream);
app.use(`${apiV1Prefix}/images`, imagesRouter);
ApiErrorAndLoggingHelper.initErrorHandlers(app);
