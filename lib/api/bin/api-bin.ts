const http = require('http');
const app = require('../applications/api-application');

import ApiErrorAndLoggingHelper = require('../helpers/api-error-and-logging-helper');

const server = http.createServer(app);
ApiErrorAndLoggingHelper.initServerOrException(app, server);

export {};
