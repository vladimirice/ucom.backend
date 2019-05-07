/* eslint-disable no-console */
import { ApiLogger, ApiLoggerStream } from '../../../config/winston';

import EnvHelper = require('../../common/helper/env-helper');
import ConsoleHelper = require('../../common/helper/console-helper');
import SocketIoServer = require('../socket-io-server');
import ApiErrorAndLoggingHelper = require('../../api/helpers/api-error-and-logging-helper');

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

ApiErrorAndLoggingHelper.initBeforeRouters(app, ApiLogger, ApiLoggerStream);

app.post('/emit_to_user', (req, res) => {
  console.warn(req.body);

  SocketIoServer.emitToUser(req.body.userId, EVENT_NAME__NOTIFICATION, req.body.payload);

  res.send({
    success: true,
  });
});

ApiErrorAndLoggingHelper.initErrorHandlers(app);

SocketIoServer.initServer(io);

export {};
