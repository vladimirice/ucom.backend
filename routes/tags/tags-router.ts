import { PostsListResponse } from '../../lib/posts/interfaces/model-interfaces';

import TagsFetchService = require('../../lib/tags/service/tags-fetch-service');
import TagApiMiddleware = require('../../lib/tags/api/tag-api-middleware');
import PostsFetchService = require('../../lib/posts/service/posts-fetch-service');
import QueryFilterService = require('../../lib/api/filters/query-filter-service');
import OrganizationsFetchService = require('../../lib/organizations/service/organizations-fetch-service');
import DiServiceLocator = require('../../lib/api/services/di-service-locator');
import UsersFetchService = require('../../lib/users/service/users-fetch-service');

const express = require('express');
require('express-async-errors');

const tagsRouter  = express.Router();

tagsRouter.get('/:tag_identity', async (req, res) => {
  const tagTitle = req.tag_identity;
  const dbTag = req.db_tag;
  const currentUserId = DiServiceLocator.getCurrentUserIdOrNull(req);

  const response = await TagsFetchService.findAndProcessOneTagById(dbTag, tagTitle, currentUserId);

  res.send(response);
});

tagsRouter.get('/:tag_identity/wall-feed', async (req, res) => {
  const { query } = req;
  const tagTitle: string  = req.tag_identity;
  const currentUserId: number | null = DiServiceLocator.getCurrentUserIdOrNull(req);

  QueryFilterService.checkLastIdExistence(query);
  const response: PostsListResponse = await PostsFetchService.findAndProcessAllForTagWallFeed(
    tagTitle,
    currentUserId,
    query,
  );

  res.send(response);
});

tagsRouter.get('/:tag_identity/organizations', async (req, res) => {
  const { query } = req;
  const tagTitle  = req.tag_identity;

  const response =
    await OrganizationsFetchService.findAndProcessAllByTagTitle(tagTitle, query);

  res.send(response);
});

tagsRouter.get('/:tag_identity/users', async (req, res) => {
  const { query } = req;
  const tagTitle = req.tag_identity;

  const currentUserId: number | null = DiServiceLocator.getCurrentUserIdOrNull(req);
  const response = await UsersFetchService.findAllAndProcessForListByTagTitle(tagTitle, query, currentUserId);

  res.send(response);
});

tagsRouter.param('tag_identity', TagApiMiddleware.tagIdentityParam);

export = tagsRouter;
