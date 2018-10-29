const SocketIoServer = require('../lib/websockets/socket-io-server');

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const port = process.env.PORT || '5000';
http.listen(port, function() {
  console.log(`listening on *:${port}`);
});

SocketIoServer.initServer(io);
