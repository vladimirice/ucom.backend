"use strict";
/* tslint:disable:max-line-length */
const ApiPostProcessor = require("../../lib/common/service/api-post-processor");
const express = require('express');
require('express-async-errors');
const orgRouter = express.Router();
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');
const { cpUpload: cpPostUpload } = require('../../lib/posts/post-edit-middleware');
const orgIdParamMiddleware = require('../../lib/organizations/middleware/organization-id-param-middleware');
/**
 * @param {Object} req
 * @returns {PostService}
 */
function getPostService(req) {
    return req.container.get('post-service');
}
/* Create post for this organization */
orgRouter.post('/:organization_id/posts', [authTokenMiddleWare, cpPostUpload], async (req, res) => {
    const response = await getPostService(req).processNewDirectPostCreationForOrg(req);
    // backward compatibility injection
    ApiPostProcessor.setEmptyCommentsForOnePost(response, true);
    res.send(response);
});
orgRouter.param('organization_id', orgIdParamMiddleware);
module.exports = orgRouter;
