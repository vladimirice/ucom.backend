"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const imagesRouter = require('./router/uploader-images-router');
const ApiErrorAndLoggingHelper = require('../api/helpers/api-error-and-logging-helper');
const diContainerMiddleware = require('../api/di-container-middleware');
const app = express();
exports.app = app;
const apiV1Prefix = '/api/v1';
require('express-async-errors');
require('../auth/passport');
const { ApiLoggerStream, ApiLogger } = require('../../config/winston');
app.use(express.json());
app.use(diContainerMiddleware);
ApiErrorAndLoggingHelper.initBeforeRouters(app, ApiLogger, ApiLoggerStream);
// #security - very weak origin policy
// @ts-ignore
app.use((req, res, next) => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'content-type,Authorization');
    // Pass to next layer of middleware
    next();
});
app.use(`${apiV1Prefix}/images`, imagesRouter);
ApiErrorAndLoggingHelper.initErrorHandlers(app);
