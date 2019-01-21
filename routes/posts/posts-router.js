"use strict";
/* tslint:disable:max-line-length */
const config = require('config');
const postsRouter = require('./comments-router');
const { AppError, BadRequestError } = require('../../lib/api/errors');
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');
const { cpUpload } = require('../../lib/posts/post-edit-middleware');
const { descriptionParser } = require('../../lib/posts/post-description-image-middleware');
const postService = require('../../lib/posts/post-service');
const postRepository = require('../../lib/posts/posts-repository');
const activityApiMiddleware = require('../../lib/activity/middleware/activity-api-middleware');
require('express-async-errors');
const activityMiddlewareSet = [
    authTokenMiddleWare,
    cpUpload,
    activityApiMiddleware.redlockBeforeActivity,
];
if (process.env.NODE_ENV !== 'test') {
    console.log('Lets inject middleware');
    activityMiddlewareSet.push(activityApiMiddleware.redlockBeforeActivity);
}
/* Get all posts */
postsRouter.get('/', async (req, res) => {
    // noinspection JSDeprecatedSymbols
    const result = await getPostService(req).findAll(req.query);
    res.send(result);
});
/* Get one post by ID */
postsRouter.get('/:post_id', async (req, res) => {
    const postService = getPostService(req);
    const postId = req.post_id;
    const post = await postService.findOnePostByIdAndProcess(postId);
    res.send(post);
});
postsRouter.post('/:post_id/join', [authTokenMiddleWare, cpUpload], async (
// @ts-ignore
req, res) => {
    res.status(404).send('Action is disabled');
});
postsRouter.post('/:post_id/upvote', activityMiddlewareSet, async (req, res) => {
    const result = await getPostService(req).userUpvotesPost(req['post_id'], req.body);
    return res.status(201).send(result);
});
postsRouter.post('/:post_id/downvote', activityMiddlewareSet, async (req, res) => {
    const result = await getPostService(req).userDownvotesPost(req['post_id'], req.body);
    return res.status(201).send(result);
});
postsRouter.post('/:post_id/repost', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const service = getPostService(req);
    const response = await service.processRepostCreation(req.body, req.post_id);
    res.status(201).send(response);
});
/* Upload post picture (for description) */
postsRouter.post('/image', [descriptionParser], async (req, res) => {
    const filename = req['files']['image'][0].filename;
    const rootUrl = config.get('host')['root_url'];
    res.send({
        files: [
            {
                url: `${rootUrl}/upload/${filename}`,
            },
        ],
    });
});
/* Create new post */
postsRouter.post('/', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const newPost = await getPostService(req).processNewPostCreation(req);
    const response = postService.isDirectPost(newPost) ? newPost : {
        id: newPost.id,
    };
    res.send(response);
});
/* Update Post */
// noinspection TypeScriptValidateJSTypes
postsRouter.patch('/:post_id', [authTokenMiddleWare, cpUpload], async (req, res) => {
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
postsRouter.param('post_id', (req, 
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
module.exports = postsRouter;
