/* tslint:disable:max-line-length */
import ApiPostProcessor = require('../../lib/common/service/api-post-processor');
import PostsInputProcessor = require('../../lib/posts/validators/posts-input-processor');
import DiServiceLocator = require('../../lib/api/services/di-service-locator');
import PostService = require('../../lib/posts/post-service');

const express = require('express');
require('express-async-errors');

const orgRouter  = express.Router();

const authTokenMiddleWare   = require('../../lib/auth/auth-token-middleware');
const { cpUpload:cpPostUpload } = require('../../lib/posts/post-edit-middleware');

const orgIdParamMiddleware  =
  require('../../lib/organizations/middleware/organization-id-param-middleware');

/* Create post for this organization */
orgRouter.post('/:organization_id/posts', [authTokenMiddleWare, cpPostUpload], async (req, res) => {
  PostsInputProcessor.process(req.body);

  const currentUser = DiServiceLocator.getCurrentUserOrException(req);
  const response = await PostService.processNewDirectPostCreationForOrg(req, currentUser);

  // backward compatibility injection
  ApiPostProcessor.setEmptyCommentsForOnePost(response, true);

  res.send(response);
});

orgRouter.param('organization_id', orgIdParamMiddleware);

export = orgRouter;
