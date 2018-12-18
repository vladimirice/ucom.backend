const SocketIoServer = require('../lib/websockets/socket-io-server');

const express = require('express');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.json());

const EVENT_NAME__NOTIFICATION = 'notification';

const port = process.env.PORT || '5000';
http.listen(port, function() {
  console.log(`listening on *:${port}`);
});

app.post('/emit_to_user', function(req, res) {
  console.warn(req.body);

  SocketIoServer.emitToUser(req.body.userId, EVENT_NAME__NOTIFICATION, req.body.payload);

  res.send({
    'success': true,
  });
});

SocketIoServer.initServer(io);
