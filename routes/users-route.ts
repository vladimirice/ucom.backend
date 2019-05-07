import UsersTrustService = require('../lib/users/service/users-trust-service');
import UserActivityService = require('../lib/users/user-activity-service');

const express = require('express');

require('express-async-errors');

const usersRouter = express.Router();
const status = require('statuses');

const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const { bodyParser } = require('../lib/users/middleware').AvatarUpload;
const userService = require('../lib/users/users-service');

const usersApiMiddleware = require('../lib/users/middleware/users-api-middleware');

const { cpUpload } = require('../lib/posts/post-edit-middleware');

/**
 *
 * @param {Object} req
 * @returns {PostService}
 */
function getPostService(req) {
  return req.container.get('post-service');
}

/**
 *
 * @param {Object} req
 * @returns {userService}
 */
function getUserService(req) {
  return req.container.get('user-service');
}

/* Find users by name fields - shortcut */
usersRouter.get('/search', async (req, res) => {
  const query = req.query.q;

  const users = await userService.findByNameFields(query);

  res.send(users);
});

/* GET all users */
usersRouter.get('/', async (req, res) => {
  const users = await getUserService(req).findAllAndProcessForList(req.query);

  res.send(users);
});

/* get one user */
usersRouter.get('/:user_id', async (req, res) => {
  const user = await getUserService(req).getUserByIdAndProcess(req.user_id);

  res.send(user);
});

/* Create post for this user */
usersRouter.post('/:user_id/posts', [authTokenMiddleWare, cpUpload], async (req, res) => {
  const response = await getPostService(req).processNewDirectPostCreationForUser(req);

  res.send(response);
});

/* GET wall feed for user */
usersRouter.get('/:user_id/wall-feed', [bodyParser], async (req, res) => {
  const userId = req.user_id;
  const { query } = req;

  const response = await getPostService(req).findAndProcessAllForUserWallFeed(userId, query);

  res.send(response);
});

usersRouter.post('/:user_id/follow', [authTokenMiddleWare, bodyParser], async (req, res) => {
  const userFrom = req.user;
  const userToId = req.user_id;

  await UserActivityService.userFollowsAnotherUser(userFrom, userToId, req.body);

  res.status(status('201')).send({
    success: true,
  });
});

usersRouter.post('/:user_id/unfollow', [authTokenMiddleWare, bodyParser], async (req, res) => {
  const userFrom = req.user;
  const userIdTo = req.user_id;

  await UserActivityService.userUnfollowsUser(userFrom, userIdTo, req.body);

  res.status(status('201')).send({
    status: 'ok',
  });
});

usersRouter.post('/:user_id/trust', [authTokenMiddleWare, cpUpload], async (req, res) => {
  const userFrom = req.user;
  const userToId = req.user_id;

  await UsersTrustService.trustUser(userFrom, userToId, req.body);

  res.status(status('201')).send({
    success: true,
  });
});

usersRouter.post('/:user_id/untrust', [authTokenMiddleWare, cpUpload], async (req, res) => {
  const userFrom = req.user;
  const userToId = req.user_id;

  await UsersTrustService.untrustUser(userFrom, userToId, req.body);

  res.status(status('201')).send({
    success: true,
  });
});

usersRouter.param('user_id', usersApiMiddleware.userIdentityParam);

export = usersRouter;
