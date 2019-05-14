"use strict";
const ApiPostProcessor = require("../lib/common/service/api-post-processor");
const PostsInputProcessor = require("../lib/posts/validators/posts-input-processor");
const express = require('express');
require('express-async-errors');
const usersRouterV2 = express.Router();
const authTokenMiddleWare = require('../lib/auth/auth-token-middleware');
const usersApiMiddleware = require('../lib/users/middleware/users-api-middleware');
const { cpUpload } = require('../lib/posts/post-edit-middleware');
/**
 *
 * @param {Object} req
 * @returns {PostService}
 */
function getPostService(req) {
    return req.container.get('post-service');
}
/* Create post for this user */
usersRouterV2.post('/:user_id/posts', [authTokenMiddleWare, cpUpload], async (req, res) => {
    PostsInputProcessor.process(req.body);
    const response = await getPostService(req).processNewDirectPostCreationForUser(req);
    // backward compatibility injection
    ApiPostProcessor.setEmptyCommentsForOnePost(response, true);
    res.send(response);
});
usersRouterV2.param('user_id', usersApiMiddleware.userIdentityParam);
module.exports = usersRouterV2;
