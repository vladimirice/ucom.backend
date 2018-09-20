const ContainerModel = require('./di-container');
const AuthService = require('../auth/authService');
const UserRepository = require('../users/users-repository');
const {AppError} = require('../../lib/api/errors');

module.exports = function (req, res, next)  {
  const containerModel = new ContainerModel();
  const container = containerModel.getContainer();
  req['container'] = container;

  const currentUserService = container.get('current-user');
  const currentUserId = AuthService.extractCurrentUserByToken(req);

  if (!currentUserId) {
    next();
  } else {
    UserRepository.findOneById(currentUserId).then(user => {
      if (!user) {
        throw new AppError(`There is no user with ID ${currentUserId} but ID is provided in token`, 500);
      }

      currentUserService.setCurrentUser(user);

      next();
    }).catch(next);
  }
};
