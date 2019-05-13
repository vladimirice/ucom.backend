"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const winston_1 = require("../../../config/winston");
const EnvHelper = require("../../common/helper/env-helper");
const ConsoleHelper = require("../../common/helper/console-helper");
const SocketIoServer = require("../socket-io-server");
const ApiErrorAndLoggingHelper = require("../../api/helpers/api-error-and-logging-helper");
const express = require('express');
const app = express();
require('express-async-errors');
// noinspection TypeScriptValidateJSTypes
const http = require('http').Server(app);
const io = require('socket.io')(http);
app.use(express.json());
const EVENT_NAME__NOTIFICATION = 'notification';
const port = EnvHelper.getPortOrException();
http.listen(port, () => ConsoleHelper.printApplicationIsStarted(port));
ApiErrorAndLoggingHelper.initBeforeRouters(app, winston_1.ApiLogger, winston_1.ApiLoggerStream);
app.post('/emit_to_user', (req, res) => {
    console.warn(req.body);
    SocketIoServer.emitToUser(req.body.userId, EVENT_NAME__NOTIFICATION, req.body.payload);
    res.send({
        success: true,
    });
});
ApiErrorAndLoggingHelper.initErrorHandlers(app);
SocketIoServer.initServer(io);
