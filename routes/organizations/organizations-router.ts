/* tslint:disable:max-line-length */
import { PostRequestQueryDto, PostsListResponse } from '../../lib/posts/interfaces/model-interfaces';

import OrganizationsFetchService = require('../../lib/organizations/service/organizations-fetch-service');
import PostsFetchService = require('../../lib/posts/service/posts-fetch-service');

const express = require('express');
const status  = require('statuses');
require('express-async-errors');

const orgRouter  = express.Router();

const authTokenMiddleWare   = require('../../lib/auth/auth-token-middleware');
const { cpUpload, cpUploadArray } =
  require('../../lib/organizations/middleware/organization-create-edit-middleware');

const { cpUpload:cpPostUpload } = require('../../lib/posts/post-edit-middleware');

const orgIdParamMiddleware  =
  require('../../lib/organizations/middleware/organization-id-param-middleware');
const activityUserToOrg    = require('../../lib/users/activity').UserToOrg;

function getOrganizationService(req) {
  return req.container.get('organizations-service');
}

function getUserService(req) {
  return req.container.get('current-user');
}

function getCurrentUserId(req): number | null {
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
  const currentUserId: number | null = getCurrentUserId(req);

  const response = await getOrganizationService(req).findOneOrgByIdAndProcess(targetId);

  const query: PostRequestQueryDto = {
    entity_state: 'card',
    post_type_id: 10,
    page: 1,
    per_page: 5,
  };

  const posts: PostsListResponse = await PostsFetchService.findManyPosts(query, currentUserId);

  const processedPosts: any[] = [];

  posts.data.forEach((post) => {
    processedPosts.push({
      id: post.id,
      entity_images: post.entity_images,
      user_id: post.user_id,
      post_type_id: post.post_type_id,
      main_image_filename: post.main_image_filename,
      created_at: post.created_at,
      updated_at: post.updated_at,
    });
  });

  response.data.discussions = response.data.id % 2 === 0 ? processedPosts : [];

  res.send(response);
});

/* GET wall feed for organization */
orgRouter.get('/:organization_id/wall-feed', [cpUploadArray], async (req, res) => {
  const response =
    await getPostService(req).findAndProcessAllForOrgWallFeed(req.organization_id, req.query);

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

/* Receive new discussions state */
// @ts-ignore
orgRouter.post('/:organization_id/discussions', [authTokenMiddleWare, cpUpload], async (req, res) => {
  return res.status(200).send({
    status: 'success',
  });
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
  const userFrom    = req.user;
  const entityIdTo  = req.organization_id;

  await activityUserToOrg.userFollowsOrganization(userFrom, entityIdTo, req.body);

  res.status(status('201')).send({
    success: true,
  });
});

/* One user unfollows organization */
orgRouter.post('/:organization_id/unfollow', [authTokenMiddleWare, cpUploadArray], async (req, res) => {
  const userFrom    = req.user;
  const entityIdTo  = req.organization_id;

  await activityUserToOrg.userUnfollowsOrganization(userFrom, entityIdTo, req.body);

  res.status(status('201')).send({
    success: true,
  });
});

orgRouter.param('organization_id', orgIdParamMiddleware);

export = orgRouter;
