const express = require('express');
const router = express.Router();
const status = require('statuses');

const {AppError, BadRequestError} = require('../lib/api/errors');
const UsersRepository = require('../lib/users/users-repository');
const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const UserActivityService = require('../lib/users/user-activity-service');
const UserService = require('../lib/users/users-service');
const winston = require('../config/winston');

/* Find users by name fields - shortcut */
router.get('/search', async (req, res) => {
  const query = req.query.q;

  const users = await UserService.findByNameFields(query);

  res.send(users);
});

/* get one user */
router.get('/:user_id', async function(req, res) {
  const user = await getUserService(req).getUserByIdAndProcess(req.user_id);

  res.send(user);
});

/* GET all users */
router.get('/', async function(req, res) {
  const users = await getUserService(req).findAllAndProcessForList();

  res.send(users);
});

/* GET all user posts */
router.get('/:user_id/posts', async function(req, res) {
  const userId = req.user_id;
  const posts = await getPostService(req).findAllByAuthor(userId);

  res.send(posts);
});

/* One user follows other user */
router.post('/:user_id/follow', [authTokenMiddleWare], async function(req, res) {
  const userFrom = req.user;
  const userToId = req.user_id;

  console.log('Action - user follows other user. Request body is: ', JSON.stringify(req.body));

  await UserActivityService.userFollowsAnotherUser(userFrom, userToId);

  res.status(status('201')).send({
    'success': true,
  });
});

/* One user unfollows other user */
router.post('/:user_id/unfollow', [authTokenMiddleWare], async function(req, res) {
  const userFrom = req.user;
  const userIdTo = req.user_id;

  winston.info('Action - user unfollows other user user. Request body is: ', JSON.stringify(req.body));

  await UserActivityService.userUnfollowsUser(userFrom, userIdTo);

  res.status(status('201')).send({
    status: 'ok'
  });
});

router.param('user_id', (req, res, next, incoming_id) => {
  const value = parseInt(incoming_id);

  if (!value) {
    throw new BadRequestError({
      'user_id': 'User ID must be a valid integer'
    })
  }

  UsersRepository.doesUserExistWithId(value)
  .then(doesExist => {

    if (!doesExist) {
      throw new AppError(`There is no user with ID ${value}`, 404);
    }
    // noinspection JSUndefinedPropertyAssignment
    req.user_id = value;

    next();

  }).catch(next);
});

/**
 *
 * @param {Object} req
 * @returns {UserService}
 */
function getUserService(req) {
  return req.container.get('user-service');
}

/**
 *
 * @param {Object} req
 * @returns {PostService}
 */
function getPostService(req) {
  return req.container.get('post-service');
}

module.exports = router;