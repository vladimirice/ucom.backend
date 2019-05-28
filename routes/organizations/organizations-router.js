"use strict";
/* tslint:disable:max-line-length */
const OrganizationsFetchService = require("../../lib/organizations/service/organizations-fetch-service");
const OrganizationsValidateDiscussions = require("../../lib/organizations/discussions/service/organizations-validate-discussions");
const OrganizationsModifyDiscussions = require("../../lib/organizations/discussions/service/organizations-modify-discussions");
const PostsInputProcessor = require("../../lib/posts/validators/posts-input-processor");
const DiServiceLocator = require("../../lib/api/services/di-service-locator");
const UserToOrganizationActivity = require("../../lib/users/activity/user-to-organization-activity");
const ActivityApiMiddleware = require("../../lib/activity/middleware/activity-api-middleware");
const PostService = require("../../lib/posts/post-service");
const OrganizationService = require("../../lib/organizations/service/organization-service");
const express = require('express');
const status = require('statuses');
require('express-async-errors');
const orgRouter = express.Router();
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');
const { cpUpload, cpUploadArray } = require('../../lib/organizations/middleware/organization-create-edit-middleware');
const { cpUpload: cpPostUpload } = require('../../lib/posts/post-edit-middleware');
const orgIdParamMiddleware = require('../../lib/organizations/middleware/organization-id-param-middleware');
// @deprecated @see GraphQL
orgRouter.get('/', async (req, res) => {
    const response = await OrganizationsFetchService.findAndProcessAll(req.query);
    res.send(response);
});
const activityMiddlewareSet = [
    authTokenMiddleWare,
    cpUploadArray,
    ActivityApiMiddleware.redlockBeforeActivity,
];
/* Create post for this organization */
orgRouter.post('/:organization_id/posts', [authTokenMiddleWare, cpPostUpload], async (req, res) => {
    PostsInputProcessor.process(req.body);
    const currentUser = DiServiceLocator.getCurrentUserOrException(req);
    const response = await PostService.processNewDirectPostCreationForOrg(req, currentUser);
    res.send(response);
});
/* Create new organization */
orgRouter.post('/', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const currentUser = DiServiceLocator.getCurrentUserOrException(req);
    const model = await OrganizationService.processNewOrganizationCreation(req, currentUser);
    return res.status(201).send({
        id: model.id,
    });
});
/* Receive new discussions state from frontend */
orgRouter.post('/:organization_id/discussions', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const currentUserId = DiServiceLocator.getCurrentUserIdOrException(req);
    await OrganizationsModifyDiscussions.processNewDiscussionsState(req.organization_model, req.body, currentUserId);
    return res.status(200).send({
        success: true,
    });
});
/* Validate one discussion */
orgRouter.get('/:organization_id/discussions/:post_id/validate', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const currentUserId = DiServiceLocator.getCurrentUserIdOrException(req);
    const orgModel = req.organization_model;
    await OrganizationsValidateDiscussions.isItPossibleToAddOneMoreDiscussion(orgModel);
    await OrganizationsValidateDiscussions.validateOneDiscussion(orgModel, +req.params.post_id, currentUserId);
    return res.status(200).send({
        success: true,
    });
});
/* Delete all discussions */
orgRouter.delete('/:organization_id/discussions', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const currentUserId = DiServiceLocator.getCurrentUserIdOrException(req);
    await OrganizationsModifyDiscussions.deleteAllDiscussions(req.organization_model, currentUserId);
    return res.status(204).send({});
});
/* Update organization */
orgRouter.patch('/:organization_id', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const currentUser = DiServiceLocator.getCurrentUserOrException(req);
    await OrganizationService.updateOrganization(req, currentUser);
    return res.status(200).send({
        status: 'ok',
    });
});
/* One user follows organization */
orgRouter.post('/:organization_id/follow', activityMiddlewareSet, async (req, res) => {
    const userFrom = req.user;
    const entityIdTo = req.organization_id;
    await UserToOrganizationActivity.userFollowsOrganization(userFrom, entityIdTo, req.body);
    res.status(status('201')).send({
        success: true,
    });
});
/* One user unfollows organization */
orgRouter.post('/:organization_id/unfollow', activityMiddlewareSet, async (req, res) => {
    const userFrom = req.user;
    const entityIdTo = req.organization_id;
    await UserToOrganizationActivity.userUnfollowsOrganization(userFrom, entityIdTo, req.body);
    res.status(status('201')).send({
        success: true,
    });
});
orgRouter.param('organization_id', orgIdParamMiddleware);
module.exports = orgRouter;
