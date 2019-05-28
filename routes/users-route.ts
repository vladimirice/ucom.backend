import UsersTrustService = require('../lib/users/service/users-trust-service');
import UserActivityService = require('../lib/users/user-activity-service');
import PostsInputProcessor = require('../lib/posts/validators/posts-input-processor');
import ActivityApiMiddleware = require('../lib/activity/middleware/activity-api-middleware');
import DiServiceLocator = require('../lib/api/services/di-service-locator');
import { UserModel } from '../lib/users/interfaces/model-interfaces';
import UsersFetchService = require('../lib/users/service/users-fetch-service');
import PostService = require('../lib/posts/post-service');

const express = require('express');

require('express-async-errors');

const usersRouter = express.Router();
const status = require('statuses');

const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const userService = require('../lib/users/users-service');

const usersApiMiddleware = require('../lib/users/middleware/users-api-middleware');

const { cpUpload } = require('../lib/posts/post-edit-middleware');

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

  const currentUser: UserModel = DiServiceLocator.getCurrentUserOrException(req);
  const users = await UsersFetchService.findAllAndProcessForList(req.query, currentUser.id);

  res.send(users);
});

/* get one user */
usersRouter.get('/:user_id', async (req, res) => {
  const currentUser = DiServiceLocator.getCurrentUserOrException(req);
  const user: UserModel = await UsersFetchService.findOneAndProcessFully(req.user_id, currentUser.id);

  res.send(user);
});

/* Create post for this user */
usersRouter.post('/:user_id/posts', [authTokenMiddleWare, cpUpload], async (req, res) => {
  PostsInputProcessor.process(req.body);

  const currentUser = DiServiceLocator.getCurrentUserOrException(req);
  const response = await PostService.processNewDirectPostCreationForUser(req, currentUser);

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
