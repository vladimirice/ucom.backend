"use strict";
/* tslint:disable:max-line-length */
const express = require('express');
const router = express.Router();
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');
const { AppError, BadRequestError } = require('../../lib/api/errors');
const commentsRepository = require('../../lib/comments/comments-repository');
const { cpUploadArray } = require('../../lib/organizations/middleware/organization-create-edit-middleware');
/* Upvote post comment */
router.post('/:post_id/comments/:comment_id/upvote', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
    const response = await getCommentsService(req).upvoteComment(req.comment_id, req.body);
    res.status(201).send(response);
});
router.get('/:post_id/comments', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
    const response = await getCommentsService(req).findAndProcessCommentsByPostId(req.post_id);
    res.send(response);
});
/* Upvote post comment */
router.post('/:post_id/comments/:comment_id/downvote', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
    const response = await getCommentsService(req).downvoteComment(req.comment_id, req.body);
    res.status(201).send(response);
});
/* create comment on comment */
router.post('/:post_id/comments/:comment_id/comments', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
    const commentService = getCommentsService(req);
    const newComment = await commentService.createNewCommentOnComment(req['body'], req['post_id'], req['comment_id']);
    // #opt need optimization
    const forResponse = await commentService.findAndProcessOneComment(newComment.id);
    res.status(201).send(forResponse);
});
/* Create comment directly to post */
router.post('/:post_id/comments', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
    const commentService = getCommentsService(req);
    const newComment = await commentService.createNewCommentOnPost(req['body'], req['post_id']);
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
        if (count === 0) {
            throw new AppError(`There is no comment with ID ${value}`, 404);
        }
        req['comment_id'] = value;
        next();
    }).catch(next);
});
/**
 * @param {Object} req
 * @returns {CommentsService}
 */
function getCommentsService(req) {
    return req['container'].get('comments-service');
}
module.exports = router;
