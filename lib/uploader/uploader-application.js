"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const { CommonHeaders } = require('ucom.libs.common').Common.Dictionary;
const imagesRouter = require('./router/uploader-images-router');
const ApiErrorAndLoggingHelper = require('../api/helpers/api-error-and-logging-helper');
const diContainerMiddleware = require('../api/di-container-middleware');
const app = express();
exports.app = app;
const apiV1Prefix = '/api/v1';
require('../auth/passport');
const { ApiLoggerStream, ApiLogger } = require('../../config/winston');
app.use(express.json());
app.use(diContainerMiddleware);
// #security - very weak origin policy
// @ts-ignore
app.use((req, res, next) => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', `X-Requested-With,content-type,Authorization,${CommonHeaders.TOKEN_USERS_EXTERNAL_GITHUB}`);
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});
ApiErrorAndLoggingHelper.initBeforeRouters(app, ApiLogger, ApiLoggerStream);
app.use(`${apiV1Prefix}/images`, imagesRouter);
ApiErrorAndLoggingHelper.initErrorHandlers(app);
