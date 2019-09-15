import { UserModel } from '../lib/users/interfaces/model-interfaces';
import { AppError, BadRequestError } from '../lib/api/errors';

import UsersTrustService = require('../lib/users/service/users-trust-service');
import UserActivityService = require('../lib/users/user-activity-service');
import PostsInputProcessor = require('../lib/posts/validators/posts-input-processor');
import ActivityApiMiddleware = require('../lib/activity/middleware/activity-api-middleware');
import DiServiceLocator = require('../lib/api/services/di-service-locator');
import UsersFetchService = require('../lib/users/service/users-fetch-service');
import PostService = require('../lib/posts/post-service');
import PostsFetchService = require('../lib/posts/service/posts-fetch-service');

const express = require('express');

require('express-async-errors');

const usersRouter = express.Router();
const status = require('statuses');

const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const userService = require('../lib/users/users-service');

const usersApiMiddleware = require('../lib/users/middleware/users-api-middleware');

const { cpUpload } = require('../lib/posts/post-edit-middleware');
const { bodyParser } = require('../lib/users/middleware').AvatarUpload;

const activityMiddlewareSet: any = [
  authTokenMiddleWare,
  cpUpload,
  ActivityApiMiddleware.redlockBeforeActivity,
];

/* Find users by name fields - shortcut */
usersRouter.get('/search', async (req, res) => {
  const query = req.query.q;

  const users = await userService.findByNameFields(query);

  res.send(users);
});

/* GET all users */
usersRouter.get('/', async (req, res) => {
  const currentUserId: number | null = DiServiceLocator.getCurrentUserIdOrNull(req);
  // noinspection JSDeprecatedSymbols
  const users = await UsersFetchService.findAllAndProcessForListLegacyRest(req.query, currentUserId);

  res.send(users);
});

// @ts-ignore
usersRouter.get('/test500error', async (req, res) => {
  throw new AppError('This is an error for tests - 500');
});

// @ts-ignore
usersRouter.get('/test400error', async (req, res) => {
  throw new BadRequestError('This is an error for tests - 400');
});

/* get one user */
usersRouter.get('/:user_id', async (req, res) => {
  const currentUserId: number | null = DiServiceLocator.getCurrentUserIdOrNull(req);
  const user: UserModel = await UsersFetchService.findOneAndProcessFully(req.user_id, currentUserId);

  res.send(user);
});

/* Create post for this user */
usersRouter.post('/:user_id/posts', [authTokenMiddleWare, cpUpload], async (req, res) => {
  PostsInputProcessor.process(req.body);

  const currentUser = DiServiceLocator.getCurrentUserOrException(req);
  const response = await PostService.processNewDirectPostCreationForUser(req, currentUser);

  res.send(response);
});

/* GET wall feed for user */
usersRouter.get('/:user_id/wall-feed', [bodyParser], async (req, res) => {
  const userId = req.user_id;
  const { query } = req;

  const currentUserId = DiServiceLocator.getCurrentUserIdOrNull(req);

  const response = await PostsFetchService.findAndProcessAllForUserWallFeed(userId, currentUserId, query);

  res.send(response);
});

usersRouter.post('/:user_id/follow', activityMiddlewareSet, async (req, res) => {
  const userFrom = req.user;
  const userToId = req.user_id;

  await UserActivityService.userFollowsAnotherUser(userFrom, userToId, req.body);

  res.status(status('201')).send({
    success: true,
  });
});

usersRouter.post('/:user_id/unfollow', activityMiddlewareSet, async (req, res) => {
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

  await UsersTrustService.trustUser(userFrom.toJSON(), userToId, req.body);

  res.status(status('201')).send({
    success: true,
  });
});

usersRouter.post('/:user_id/untrust', [authTokenMiddleWare, cpUpload], async (req, res) => {
  const userFrom = req.user;
  const userToId = req.user_id;

  await UsersTrustService.untrustUser(userFrom.toJSON(), userToId, req.body);

  res.status(status('201')).send({
    success: true,
  });
});

usersRouter.param('user_id', usersApiMiddleware.userIdentityParam);

export = usersRouter;
