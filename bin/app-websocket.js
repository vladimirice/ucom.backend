"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require('express');
const app = express();
// noinspection TypeScriptValidateJSTypes
const http = require('http').Server(app);
const io = require('socket.io')(http);
const socketIoServer = require('../lib/websockets/socket-io-server');
app.use(express.json());
const EVENT_NAME__NOTIFICATION = 'notification';
const port = process.env.PORT || '5000';
http.listen(port, () => {
    console.log(`listening on *:${port}`);
});
app.post('/emit_to_user', (req, res) => {
    console.warn(req.body);
    socketIoServer.emitToUser(req.body.userId, EVENT_NAME__NOTIFICATION, req.body.payload);
    res.send({
        success: true,
    });
});
socketIoServer.initServer(io);
