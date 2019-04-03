"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require('http');
const { app } = require('../lib/uploader/uploader-application');
const server = http.createServer(app);
ApiErrorAndLoggingHelper.initServerOrException(app, server);
