"use strict";
/* tslint:disable:max-line-length */
const comments_creator_service_1 = require("../../lib/comments/service/comments-creator-service");
const express = require('express');
const router = express.Router();
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');
const { AppError, BadRequestError } = require('../../lib/api/errors');
const commentsRepository = require('../../lib/comments/comments-repository');
const { cpUploadArray } = require('../../lib/organizations/middleware/organization-create-edit-middleware');
/**
 * @param {Object} req
 * @returns {CommentsService}
 */
function getCommentsService(req) {
    return req.container.get('comments-service');
}
function getUserService(req) {
    return req.container.get('current-user');
}
/* Create comment directly to post */
router.post('/:post_id/comments', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
    const CurrentUserService = getUserService(req);
    const currentUser = CurrentUserService.getUser();
    const newComment = await comments_creator_service_1.CommentsCreatorService.createNewCommentOnPost(req.body, req.post_id, currentUser);
    const commentService = getCommentsService(req);
    const forResponse = await commentService.findAndProcessOneComment(newComment.id);
    res.status(201).send(forResponse);
});
/* create comment on comment */
router.post('/:post_id/comments/:comment_id/comments', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
    const commentService = getCommentsService(req);
    const CurrentUserService = getUserService(req);
    const currentUser = CurrentUserService.getUser();
    const newComment = await comments_creator_service_1.CommentsCreatorService.createNewCommentOnComment(req.body, req.post_id, req.comment_id, currentUser);
    // #opt need optimization
    const forResponse = await commentService.findAndProcessOneComment(newComment.id);
    res.status(201).send(forResponse);
});
// @ts-ignore
router.param('comment_id', (req, res, next, commentId) => {
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
module.exports = router;
