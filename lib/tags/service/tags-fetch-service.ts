import { EntityNames } from 'ucom.libs.common';
import { DbTag, TagsListResponse, TagsModelResponse } from '../interfaces/dto-interfaces';
import {
  DbParamsDto,
  QueryFilteredRepository,
  RequestQueryDto,
} from '../../api/filters/interfaces/query-filter-interfaces';

import QueryFilterService = require('../../api/filters/query-filter-service');
import TagsRepository = require('../repository/tags-repository');
import ApiPostProcessor = require('../../common/service/api-post-processor');
import UsersActivityEventsViewRepository = require('../../users/repository/users-activity/users-activity-events-view-repository');

const moment = require('moment');

const postsFetchService         = require('../../posts/service/posts-fetch-service');
const usersFetchService         = require('../../users/service/users-fetch-service');
const organizationsFetchService =
  require('../../organizations/service/organizations-fetch-service');

const apiPostProcessor = require('../../common/service/api-post-processor');

class TagsFetchService {
  public static async findAndProcessManyTags(requestQuery: RequestQueryDto): Promise<TagsListResponse> {
    const repository: QueryFilteredRepository = TagsRepository;

    const params: DbParamsDto =
      QueryFilterService.getQueryParametersWithRepository(requestQuery, repository, true);

    const promises: any = [
      TagsRepository.findManyTagsForList(requestQuery, params),
      TagsRepository.countManyTagsForList(requestQuery, params),
    ];

    return this.findAndProcessManyByParams(promises, requestQuery, params);
  }

  public static async findAndProcessOneTagById(
    dbTag: DbTag,
    tagTitle: string,
    currentUserId: number | null,
  ) {
    // #task - should be provided by frontend
    const wallFeedQuery = {
      page: 1,
      per_page: 10,
    };

    const relatedEntitiesQuery = {
      page: 1,
      per_page: 5,
      v2: true,
    };

    const [posts, users, orgs] = await Promise.all([
      postsFetchService.findAndProcessAllForTagWallFeed(tagTitle, currentUserId, wallFeedQuery),
      usersFetchService.findAllAndProcessForListByTagTitle(
        tagTitle,
        relatedEntitiesQuery,
        currentUserId,
      ),
      organizationsFetchService.findAndProcessAllByTagTitle(tagTitle, relatedEntitiesQuery),
    ]);

    // noinspection TypeScriptValidateJSTypes
    apiPostProcessor.processOneTag(dbTag);

    dbTag.views_count = await UsersActivityEventsViewRepository.getViewsCountForEntity(dbTag.id, EntityNames.TAGS);

    return {
      posts,
      users,
      orgs,

      id:         dbTag.id,
      title:      dbTag.title,
      views_count: dbTag.views_count,
      created_at: moment(dbTag.created_at).utc().format('YYYY-MM-DD HH:mm:ss'),
      current_rate: dbTag.current_rate,
    };
  }

  private static async findAndProcessManyByParams(
    promises: Promise<any>[],
    query: RequestQueryDto,
    params: DbParamsDto,
  ): Promise<TagsListResponse> {
    // @ts-ignore
    const [data, totalAmount]: [TagsModelResponse[], number] = await Promise.all(promises);

    ApiPostProcessor.processManyTags(data);
    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      data,
      metadata,
    };
  }
}

export = TagsFetchService;
