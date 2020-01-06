/* eslint-disable max-len */

import ApiPostProcessor = require('../../lib/common/service/api-post-processor');
import _ = require('lodash');
import PostsInputProcessor = require('../../lib/posts/validators/posts-input-processor');
import DiServiceLocator = require('../../lib/api/services/di-service-locator');
import PostCreatorService = require('../../lib/posts/service/post-creator-service');
import PostService = require('../../lib/posts/post-service');
import PostToEventIdService = require('../../lib/posts/service/post-to-event-id-service');

const express = require('express');

const PostsV2Router = express.Router();
const { AppError, BadRequestError } = require('../../lib/api/errors');
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');

const { cpUpload } = require('../../lib/posts/post-edit-middleware');
const postService = require('../../lib/posts/post-service');

const postRepository = require('../../lib/posts/posts-repository');

require('express-async-errors');

/* Create new post */
PostsV2Router.post('/', [authTokenMiddleWare, cpUpload], async (req, res) => {
  PostsInputProcessor.process(req.body);

  const currentUser = DiServiceLocator.getCurrentUserOrException(req);

  const eventId = PostToEventIdService.getCreateMediaPostEventId(req.body);
  const newPost = await PostCreatorService.processNewPostCreation(req, eventId, currentUser);

  const response = postService.isDirectPost(newPost) ? newPost : {
    id: newPost.id,
  };

  res.send(response);
});

/* Update Post */
// noinspection TypeScriptValidateJSTypes
PostsV2Router.patch('/:post_id', [authTokenMiddleWare, cpUpload], async (req, res) => {
  const userId = req.user.id;
  const postId = req.post_id;

  const currentUser = DiServiceLocator.getCurrentUserOrException(req);

  if (!_.isEmpty(req.files)) {
    throw new BadRequestError('It is not allowed to upload files. Please consider to use a entity_images');
  }

  PostsInputProcessor.process(req.body);
  const updatedPost = await PostService.updateAuthorPost(postId, userId, req.body, currentUser);

  if (postService.isDirectPost(updatedPost)) {
    ApiPostProcessor.deleteCommentsFromModel(updatedPost);
    res.send(updatedPost);
  } else {
    res.send({
      post_id: updatedPost.id,
    });
  }
});

PostsV2Router.param('post_id', (
  req,
  // @ts-ignore
  res,
  next,
  postId,
) => {
  const value = +postId;

  if (!value) {
    throw new BadRequestError({
      post_id: 'Post ID must be a valid integer',
    });
  }

  postRepository.getModel().count({
    where: {
      id: value,
    },
  }).then((count) => {
    // eslint-disable-next-line promise/always-return
    if (count === 0) {
      throw new AppError(`There is no post with ID ${value}`, 404);
    }
    req.post_id = value;

    // eslint-disable-next-line promise/no-callback-in-promise
    next();
    // eslint-disable-next-line promise/no-callback-in-promise
  }).catch(next);
});

export = PostsV2Router;
