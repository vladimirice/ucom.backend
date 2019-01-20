const authService = require('../auth/authService');
const { AppError } = require('../../lib/api/errors');

let server;

const userToSockets = {};

class SocketIoServer {
  static initServer(newServer) {
    server = newServer;

    this.initEvents();
  }

  static initEvents() {
    server.use((socket, next) => {
      if (socket.handshake.query && socket.handshake.query.token) {
        try {
          const token = socket.handshake.query.token;
          const userId = authService.extractCurrentUserIdByTokenOrError(token);

          socket.uos_app_user_id = userId;

          next();
        } catch (err) {
          console.warn('An auth error is occurred');

          next(err);
        }
      } else {
        console.warn('Auth token is required');
        next(new AppError('Auth is required', 401));
      }
    });

    server.on('connection', (socket) => {

      if (!userToSockets[socket.uos_app_user_id]) {
        userToSockets[socket.uos_app_user_id] = [];
      }

      userToSockets[socket.uos_app_user_id].push(socket);

      socket.on('disconnect', () => {
        const indexToDelete = userToSockets[socket.uos_app_user_id].indexOf(socket);

        delete userToSockets[socket.uos_app_user_id][indexToDelete];

      });
    });
  }

  /**
   *
   * @param {number} userId
   * @param {string} eventName
   * @param {Object} payload
   * @return {boolean}
   */
  static emitToUser(userId, eventName, payload) {
    const socketSet = userToSockets[userId];
    if (!socketSet) {

      return false;
    }

    socketSet.forEach((socket) => {
      socket.emit(eventName, payload);
    });

    return true;
  }
}

export = SocketIoServer;
