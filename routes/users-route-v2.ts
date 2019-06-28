import ApiPostProcessor = require('../lib/common/service/api-post-processor');
import PostsInputProcessor = require('../lib/posts/validators/posts-input-processor');
import PostService = require('../lib/posts/post-service');
import DiServiceLocator = require('../lib/api/services/di-service-locator');

const express = require('express');
require('express-async-errors');

const usersRouterV2 = express.Router();

const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');

const usersApiMiddleware = require('../lib/users/middleware/users-api-middleware');

const { cpUpload } = require('../lib/posts/post-edit-middleware');

/* Create post for this user */
usersRouterV2.post('/:user_id/posts', [authTokenMiddleWare, cpUpload], async (req, res) => {
  PostsInputProcessor.process(req.body);

  const currentUser = DiServiceLocator.getCurrentUserOrException(req);
  const response = await PostService.processNewDirectPostCreationForUser(req, currentUser);

  // backward compatibility injection
  ApiPostProcessor.setEmptyCommentsForOnePost(response, true);

  res.send(response);
});

usersRouterV2.param('user_id', usersApiMiddleware.userIdentityParam);

export = usersRouterV2;
