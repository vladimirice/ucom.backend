"use strict";
/* tslint:disable:max-line-length */
const PostsV2Router = require('./comments-router');
const { AppError, BadRequestError } = require('../../lib/api/errors');
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');
const { cpUpload } = require('../../lib/posts/post-edit-middleware');
const postService = require('../../lib/posts/post-service');
const postRepository = require('../../lib/posts/posts-repository');
require('express-async-errors');
PostsV2Router.post('/:post_id/repost', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const service = getPostService(req); //
    const response = await service.processRepostCreation(req.body, req.post_id);
    res.status(201).send(response);
});
/* Create new post */
PostsV2Router.post('/', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const newPost = await getPostService(req).processNewPostCreation(req);
    const response = postService.isDirectPost(newPost) ? newPost : {
        id: newPost.id,
    };
    res.send(response);
});
/* Update Post */
// noinspection TypeScriptValidateJSTypes
PostsV2Router.patch('/:post_id', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const userId = req['user'].id;
    const postId = req['post_id'];
    // Lets change file
    const files = req['files'];
    // noinspection OverlyComplexBooleanExpressionJS
    if (files && files['main_image_filename'] && files['main_image_filename'][0] && files['main_image_filename'][0].filename) {
        req.body['main_image_filename'] = files['main_image_filename'][0].filename;
    }
    else {
        // Not required to update main_image_filename if there is not uploaded file
        delete req.body.main_image_filename;
    }
    const params = req.body;
    const updatedPost = await getPostService(req).updateAuthorPost(postId, userId, params);
    if (postService.isDirectPost(updatedPost)) {
        res.send(updatedPost);
    }
    else {
        res.send({
            post_id: updatedPost.id,
        });
    }
});
PostsV2Router.param('post_id', (req, 
// @ts-ignore
res, next, postId) => {
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
        if (count === 0) {
            throw new AppError(`There is no post with ID ${value}`, 404);
        }
        req['post_id'] = value;
        next();
    }).catch(next);
});
/**
 * @param {Object} req
 * @returns {postService}
 */
function getPostService(req) {
    return req['container'].get('post-service');
}
module.exports = PostsV2Router;
