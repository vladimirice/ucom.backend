const AuthService = require('../auth/authService');
const { AppError } = require('../../lib/api/errors');

let server;

let userToSockets = {};

class SocketIoServer {
  static initServer(newServer) {
    server = newServer;

    this.initEvents();
  }

  static initEvents() {
    server.use(function(socket, next) {
      if (socket.handshake.query && socket.handshake.query.token) {
        try {
          const token = socket.handshake.query.token;
          console.warn('Token is: ', token);
          const userId = AuthService.extractCurrentUserIdByTokenOrError(token);
          console.warn('Decoded userId is: ', userId);

          socket.uos_app_user_id = userId;

          next();
        } catch (err) {
          console.warn('An auth error is occurred');
          console.dir(err);

          next(err);
        }
      } else {
        console.warn('Auth token is required');
        next(new AppError('Auth is required', 401));
      }
    });

    server.on('connection', function(socket){
      console.log('socket user id is: ', socket.uos_app_user_id);
      userToSockets[socket.uos_app_user_id] = socket;

      console.log('a user connected from server class');

      socket.on('disconnect', function(){
        delete userToSockets[socket.uos_app_user_id];

        console.log('user disconnected');
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
    const socket = userToSockets[userId];
    if (!socket) {
      console.warn(`There is no opened socket for user with id ${userId}`);

      return false;
    }

    socket.emit(eventName, payload);

    return true;
  }

  /**
   *
   * @param {string} eventName
   * @param {Object} payload
   */
  static emitToEverybody(eventName, payload) {
    server.emit(eventName, payload);
  }
}

module.exports = SocketIoServer;
