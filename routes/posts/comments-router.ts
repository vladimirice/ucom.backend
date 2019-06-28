import { CommentsCreatorService } from '../../lib/comments/service/comments-creator-service';
import { UserModel } from '../../lib/users/interfaces/model-interfaces';

import CommentsActivityService = require('../../lib/comments/comments-activity-service');
import CommentsFetchService = require('../../lib/comments/service/comments-fetch-service');
import DiServiceLocator = require('../../lib/api/services/di-service-locator');

const express = require('express');

const router = express.Router();
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');
const { AppError, BadRequestError } = require('../../lib/api/errors');
const commentsRepository = require('../../lib/comments/comments-repository');
const { cpUploadArray } = require('../../lib/organizations/middleware/organization-create-edit-middleware');

router.post('/:post_id/comments/:comment_id/upvote', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
  const currentUser = DiServiceLocator.getCurrentUserOrException(req);
  const response = await CommentsActivityService.userUpvotesComment(
    currentUser,
    req.comment_id,
    req.body,
  );

  res.status(201).send(response);
});

router.post('/:post_id/comments/:comment_id/downvote', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
  const currentUser = DiServiceLocator.getCurrentUserOrException(req);

  const response = await CommentsActivityService.userDownvotesComment(
    currentUser,
    req.comment_id,
    req.body,
  );

  res.status(201).send(response);
});

router.post('/:post_id/comments', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
  const currentUser = DiServiceLocator.getCurrentUserOrException(req);

  const newComment = await CommentsCreatorService.createNewCommentOnPost(
    req.body,
    req.post_id,
    currentUser,
  );

  // #opt need optimization
  const forResponse = await CommentsFetchService.findAndProcessOneComment(newComment.id, currentUser.id);

  res.status(201).send(forResponse);
});

router.post('/:post_id/comments/:comment_id/comments', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
  const currentUser: UserModel = DiServiceLocator.getCurrentUserOrException(req);

  const newComment = await CommentsCreatorService.createNewCommentOnComment(
    req.body,
    req.post_id,
    req.comment_id,
    currentUser,
  );

  // #opt need optimization
  const forResponse = await CommentsFetchService.findAndProcessOneComment(newComment.id, currentUser.id);

  res.status(201).send(forResponse);
});

router.param('comment_id', (
  req,
  // @ts-ignore
  res,
  next,
  commentId,
) => {
  const value = +commentId;

  if (!value) {
    throw new BadRequestError({
      comment_id: 'comment ID must be a valid integer',
    });
  }

  commentsRepository.getModel().count({
    where: {
      id: value,
    },
  }).then((count) => {
    // eslint-disable-next-line promise/always-return
    if (count === 0) {
      throw new AppError(`There is no comment with ID ${value}`, 404);
    }
    req.comment_id = value;

    // eslint-disable-next-line promise/no-callback-in-promise
    next();
    // eslint-disable-next-line promise/no-callback-in-promise
  }).catch(next);
});

export = router;
