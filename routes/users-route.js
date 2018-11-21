const express = require('express');
const UsersRouter  = express.Router();
const status  = require('statuses');

const { AppError, BadRequestError } = require('../lib/api/errors');
const UsersRepository = require('../lib/users/users-repository');
const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const { bodyParser } = require('../lib/users/middleware').AvatarUpload;
const UserActivityService = require('../lib/users/user-activity-service');
const UserService = require('../lib/users/users-service');

const { cpUpload } = require('../lib/posts/post-edit-middleware');

/* Find users by name fields - shortcut */
UsersRouter.get('/search', async (req, res) => {
  const query = req.query.q;

  const users = await UserService.findByNameFields(query);

  res.send(users);
});

/* GET all users */
UsersRouter.get('/', async function(req, res) {
  const users = await getUserService(req).findAllAndProcessForList();

  res.send(users);
});

/* get one user */
UsersRouter.get('/:user_id', async function(req, res) {
  const user = await getUserService(req).getUserByIdAndProcess(req.user_id);

  res.send(user);
});

/* GET all user posts */
UsersRouter.get('/:user_id/posts', async function(req, res) {

  const userId = req.user_id;
  const posts = await getPostService(req).findAndProcessAllForUserWallFeed(userId);

  res.send(posts);
});

/* Create post for this user */
UsersRouter.post('/:user_id/posts', [authTokenMiddleWare, cpUpload], async function(req, res) {
  const response = await getPostService(req).processNewDirectPostCreationForUser(req);

  res.send(response);
});

/* GET wall feed for user */
UsersRouter.get('/:user_id/wall-feed', [ bodyParser ], async function(req, res) {
  const userId = req.user_id;
  const query = req.query;

  const response = await getPostService(req).findAndProcessAllForUserWallFeed(userId, query);

  res.send(response);
});

/* One user follows other user */
UsersRouter.post('/:user_id/follow', [authTokenMiddleWare, bodyParser ], async function(req, res) {
  const userFrom = req.user;
  const userToId = req.user_id;

  await UserActivityService.userFollowsAnotherUser(userFrom, userToId, req.body);

  res.status(status('201')).send({
    'success': true,
  });
});

/* One user unfollows other user */
UsersRouter.post('/:user_id/unfollow', [authTokenMiddleWare, bodyParser ], async function(req, res) {
  const userFrom = req.user;
  const userIdTo = req.user_id;

  await UserActivityService.userUnfollowsUser(userFrom, userIdTo, req.body);

  res.status(status('201')).send({
    status: 'ok'
  });
});

UsersRouter.param('user_id', (req, res, next, incoming_id) => {
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

module.exports = UsersRouter;