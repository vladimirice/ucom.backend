/* eslint-disable promise/no-callback-in-promise */
// tslint:disable-next-line:variable-name
const ContainerModel = require('./di-container');
const authService = require('../auth/authService');
const userRepository = require('../users/users-repository');
const { AppError } = require('../../lib/api/errors');

// @ts-ignore
export = (req, res, next) => {
  // @ts-ignore
  const containerModel = new ContainerModel();
  const container = containerModel.getContainer();
  req.container = container;

  const currentUserService = container.get('current-user');
  const currentUserId = authService.extractCurrentUserByToken(req);

  if (!currentUserId) {
    next();
  } else {
    userRepository.findOneById(currentUserId).then((user) => {
      // eslint-disable-next-line promise/always-return
      if (!user) {
        throw new AppError(
          `There is no user with ID ${currentUserId} but ID is provided in token`, 500,
        );
      }

      req.current_user_id = currentUserId;
      currentUserService.setCurrentUser(user);

      next();
    }).catch(next);
  }
};
