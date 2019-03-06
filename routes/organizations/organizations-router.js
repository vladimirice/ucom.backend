"use strict";
/* tslint:disable:max-line-length */
const OrganizationsFetchService = require("../../lib/organizations/service/organizations-fetch-service");
const OrganizationsValidateDiscussions = require("../../lib/organizations/discussions/service/organizations-validate-discussions");
const OrganizationsModifyDiscussions = require("../../lib/organizations/discussions/service/organizations-modify-discussions");
const express = require('express');
const status = require('statuses');
require('express-async-errors');
const orgRouter = express.Router();
const authTokenMiddleWare = require('../../lib/auth/auth-token-middleware');
const { cpUpload, cpUploadArray } = require('../../lib/organizations/middleware/organization-create-edit-middleware');
const { cpUpload: cpPostUpload } = require('../../lib/posts/post-edit-middleware');
const orgIdParamMiddleware = require('../../lib/organizations/middleware/organization-id-param-middleware');
const activityUserToOrg = require('../../lib/users/activity').UserToOrg;
function getOrganizationService(req) {
    return req.container.get('organizations-service');
}
function getUserService(req) {
    return req.container.get('current-user');
}
function getCurrentUserId(req) {
    const CurrentUserService = getUserService(req);
    return CurrentUserService.getCurrentUserId();
}
/**
 * @param {Object} req
 * @returns {PostService}
 */
function getPostService(req) {
    return req.container.get('post-service');
}
/* Get all organizations */
orgRouter.get('/', async (req, res) => {
    const response = await OrganizationsFetchService.findAndProcessAll(req.query);
    res.send(response);
});
/* Get one organization by ID */
orgRouter.get('/:organization_id', async (req, res) => {
    const targetId = req.organization_id;
    const response = await getOrganizationService(req).findOneOrgByIdAndProcess(targetId);
    res.send(response);
});
/* GET wall feed for organization */
orgRouter.get('/:organization_id/wall-feed', [cpUploadArray], async (req, res) => {
    const response = await getPostService(req).findAndProcessAllForOrgWallFeed(req.organization_id, req.query);
    res.send(response);
});
/* Create post for this organization */
orgRouter.post('/:organization_id/posts', [authTokenMiddleWare, cpPostUpload], async (req, res) => {
    const response = await getPostService(req).processNewDirectPostCreationForOrg(req);
    res.send(response);
});
/* Create new organization */
orgRouter.post('/', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const model = await getOrganizationService(req).processNewOrganizationCreation(req);
    return res.status(201).send({
        id: model.id,
    });
});
/* Receive new discussions state from frontend */
orgRouter.post('/:organization_id/discussions', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const currentUserId = getCurrentUserId(req);
    await OrganizationsModifyDiscussions.processNewDiscussionsState(req.organization_model, req.body, currentUserId);
    return res.status(200).send({
        success: true,
    });
});
/* Validate one discussion */
orgRouter.get('/:organization_id/discussions/:post_id/validate', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const currentUserId = getCurrentUserId(req);
    await OrganizationsValidateDiscussions.validateOneDiscussion(req.organization_model, +req.params.post_id, currentUserId);
    return res.status(200).send({
        success: true,
    });
});
/* Delete all discussions */
orgRouter.delete('/:organization_id/discussions', [authTokenMiddleWare, cpUpload], async (req, res) => {
    const currentUserId = getCurrentUserId(req);
    await OrganizationsModifyDiscussions.deleteAllDiscussions(req.organization_model, currentUserId);
    return res.status(204).send({});
});
/* Update organization */
orgRouter.patch('/:organization_id', [authTokenMiddleWare, cpUpload], async (req, res) => {
    await getOrganizationService(req).updateOrganization(req);
    return res.status(200).send({
        status: 'ok',
    });
});
/* One user follows organization */
orgRouter.post('/:organization_id/follow', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
    const userFrom = req.user;
    const entityIdTo = req.organization_id;
    await activityUserToOrg.userFollowsOrganization(userFrom, entityIdTo, req.body);
    res.status(status('201')).send({
        success: true,
    });
});
/* One user unfollows organization */
orgRouter.post('/:organization_id/unfollow', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
    const userFrom = req.user;
    const entityIdTo = req.organization_id;
    await activityUserToOrg.userUnfollowsOrganization(userFrom, entityIdTo, req.body);
    res.status(status('201')).send({
        success: true,
    });
});
orgRouter.param('organization_id', orgIdParamMiddleware);
module.exports = orgRouter;
