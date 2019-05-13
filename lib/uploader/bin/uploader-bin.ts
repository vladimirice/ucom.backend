const http = require('http');
const { app } = require('../uploader-application');

const ApiErrorAndLoggingHelper = require('../../api/helpers/api-error-and-logging-helper');

const server = http.createServer(app);
ApiErrorAndLoggingHelper.initServerOrException(app, server);

export {};
