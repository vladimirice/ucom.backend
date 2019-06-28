/* eslint-disable promise/no-callback-in-promise */
// tslint:disable-next-line:variable-name
import { diContainer } from '../../config/inversify/inversify.config';

const authService = require('../auth/authService');
const userRepository = require('../users/users-repository');
const { AppError } = require('../../lib/api/errors');


// @ts-ignore
export = (req, res, next) => {
  req.container = diContainer;

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
      req.currentUser = user;

      next();
    }).catch(next);
  }
};
