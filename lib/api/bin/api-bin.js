"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require('http');
const app = require('../applications/api-application');
const ApiErrorAndLoggingHelper = require("../helpers/api-error-and-logging-helper");
const server = http.createServer(app);
ApiErrorAndLoggingHelper.initServerOrException(app, server);
