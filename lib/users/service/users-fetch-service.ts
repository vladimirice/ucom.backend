import {
  UserIdToUserModelCard,
  UserModel,
  UsersListResponse,
} from '../interfaces/model-interfaces';
import { DbParamsDto, RequestQueryDto } from '../../api/filters/interfaces/query-filter-interfaces';
import { PostRequestQueryDto } from '../../posts/interfaces/model-interfaces';
import { AppError } from '../../api/errors';

import UsersRepository = require('../users-repository');

import UserPostProcessor = require('../user-post-processor');
import ApiPostProcessor = require('../../common/service/api-post-processor');
import PostsModelProvider = require('../../posts/service/posts-model-provider');
import EntityListCategoryDictionary = require('../../stats/dictionary/entity-list-category-dictionary');
import QueryFilterService = require('../../api/filters/query-filter-service');
import _ = require('lodash');
import UsersModelProvider = require('../users-model-provider');
import PostsRepository = require('../../posts/posts-repository');

const usersRepository       = require('../users-repository');
const queryFilterService    = require('../../api/filters/query-filter-service');
const usersActivityService  = require('../user-activity-service');
const userPostProcessor     = require('../user-post-processor');

class UsersFetchService {
  static async findOneAndProcessForCard(
    userId: number,
  ): Promise<UserModel | null> {
    const model: UserModel | null = await UsersRepository.findOneByIdForPreview(userId);

    if (!model) {
      return null;
    }

    UserPostProcessor.processOnlyUserItself(model);

    return model;
  }

  public static async findManyAndProcessForCard(
    usersIds: number[],
  ): Promise<UserIdToUserModelCard> {
    const modelsSet: UserIdToUserModelCard =
      await UsersRepository.findManyUsersByIdForCard(usersIds);

    UserPostProcessor.processUserIdToUserModelCard(modelsSet);

    return modelsSet;
  }

  public static async findAllAndProcessForList(query: RequestQueryDto, currentUserId): Promise<UsersListResponse> {
    let data;
    if (query.overview_type && query.entity_name) {
      data = this.getManyUsersListAsRelatedToEntityPromises(query, query.entity_name);
    } else {
      data = this.getManyUsersListPromises(query);
    }

    return this.findAllAndProcessForListByParams(data.promises, query, data.params, currentUserId);
  }

  private static getManyUsersListAsRelatedToEntityPromises(
    query: PostRequestQueryDto,
    entityName: string,
  ): { promises: Promise<any>[], params: DbParamsDto } {
    if (entityName !== PostsModelProvider.getEntityName()) {
      throw new AppError(`Unsupported entityName: ${entityName}`, 500);
    }

    if (!query.post_type_id) {
      throw new AppError('post_type_id parameter is required', 400);
    }

    const relatedRepository = PostsRepository;

    const orderByRelationMap    = relatedRepository.getOrderByRelationMap(false);
    const allowedOrderBy        = relatedRepository.getAllowedOrderBy();
    const whereProcessor        = relatedRepository.getWhereProcessor();

    let params: DbParamsDto = QueryFilterService.getQueryParameters(query, orderByRelationMap, allowedOrderBy, whereProcessor);
    params = _.defaults(params, UsersRepository.getDefaultListParams());
    QueryFilterService.processAttributes(params, UsersModelProvider.getTableName(), true);

    const mainEntityField = 'user_id';

    const statsFieldName = EntityListCategoryDictionary.getStatsFieldByOverviewType(query.overview_type!);
    const promises = [
      UsersRepository.findManyAsRelatedToEntity(params, statsFieldName, mainEntityField, query.overview_type!, entityName),
      UsersRepository.countManyUsersAsRelatedToEntity(params, entityName, statsFieldName, query.overview_type!),
    ];

    return {
      promises,
      params,
    };
  }

  private static getManyUsersListPromises(query: RequestQueryDto): { promises: Promise<any>[], params: DbParamsDto } {
    // preparation for universal class-fetching processor
    const repository  = usersRepository;
    const params      = queryFilterService.getQueryParametersWithRepository(query, repository);

    const promises = [
      repository.findAllForList(params),
      repository.countAll(params),
    ];

    return {
      promises,
      params,
    };
  }

  private static async findAllAndProcessForListByParams(
    promises: Promise<any>[],
    query: RequestQueryDto,
    params: DbParamsDto,
    currentUserId,
  ) {
    const [models, totalAmount] = await Promise.all(promises);

    if (currentUserId) {
      const activityData = await usersActivityService.getUserActivityData(currentUserId);
      userPostProcessor.addMyselfDataByActivityArrays(models, activityData);
    }

    ApiPostProcessor.processUsersAfterQuery(models);
    const metadata = queryFilterService.getMetadata(totalAmount, query, params);

    // @ts-ignore
    if (query.v2 || query.overview_type) {
      return {
        metadata,
        data: models,
      };
    }

    return models;
  }

  /**
   *
   * @param {string} tagTitle
   * @param {Object} query
   * @param {number} currentUserId
   * @returns {Promise<*>}
   */
  static async findAllAndProcessForListByTagTitle(tagTitle, query, currentUserId) {
    queryFilterService.checkLastIdExistence(query);

    const repository    = usersRepository;
    const params          = queryFilterService.getQueryParametersWithRepository(query, repository);

    const [models, totalAmount] = await Promise.all([
      repository.findAllByTagTitle(tagTitle, params),
      repository.countAllByTagTitle(tagTitle),
    ]);

    if (currentUserId) {
      const activityData = await usersActivityService.getUserActivityData(currentUserId);
      userPostProcessor.addMyselfDataByActivityArrays(models, activityData);
    }

    ApiPostProcessor.processUsersAfterQuery(models);
    const metadata = queryFilterService.getMetadata(totalAmount, query, params);

    if (query.v2) {
      return {
        metadata,
        data: models,
      };
    }

    return models;
  }
}

export = UsersFetchService;
