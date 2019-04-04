const http = require('http');
const { app } = require('../lib/uploader/uploader-application');

const ApiErrorAndLoggingHelper = require('../lib/api/helpers/api-error-and-logging-helper');

const server = http.createServer(app);
ApiErrorAndLoggingHelper.initServerOrException(app, server);

export {};
