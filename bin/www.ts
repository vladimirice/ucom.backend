export {};

const http = require('http');
const app = require('../app');
const socketIoServer = require('../lib/websockets/socket-io-server');

/**
 * Get port from environment and store in Express.
 */
// eslint-disable-next-line no-use-before-define
const port: any = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

// noinspection JSCheckFunctionSignatures
server.listen(port);
// eslint-disable-next-line no-use-before-define
server.on('error', onError);

// eslint-disable-next-line import/order
const io = require('socket.io').listen(server);

socketIoServer.initServer(io);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  const parsed = parseInt(val, 10);

  if (Number.isNaN(parsed)) {
    // named pipe
    return val;
  }

  if (parsed >= 0) {
    // port number
    return parsed;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? `Pipe ${port}`
    : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      throw new Error(`${bind} requires elevated privileges`);
    case 'EADDRINUSE':
      throw new Error(`${bind} is already in use`);
    default:
      throw error;
  }
}
