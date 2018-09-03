const ContainerModel = require('./di-container');
const AuthService = require('../auth/authService');

module.exports = function (req, res, next)  {
  const containerModel = new ContainerModel();
  const container = containerModel.getContainer();

  const currentUser = container.get('current-user');
  const currentUserId = AuthService.extractCurrentUserByToken(req);

  currentUser.setCurrentUserId(currentUserId);

  req['container'] = container;

  next();
};
