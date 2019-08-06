import {
  OneContentActivityUsersQueryDto,
  UserIdToUserModelCard,
  UserModel, UsersActivityQueryDto,
  UsersListResponse, UsersRequestQueryDto,
} from '../interfaces/model-interfaces';
import { DbParamsDto, RequestQueryDto } from '../../api/filters/interfaces/query-filter-interfaces';
import { PostRequestQueryDto } from '../../posts/interfaces/model-interfaces';
import { AppError, BadRequestError } from '../../api/errors';

import _ = require('lodash');
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;

import UsersRepository = require('../users-repository');

import UserPostProcessor = require('../user-post-processor');
import ApiPostProcessor = require('../../common/service/api-post-processor');
import PostsModelProvider = require('../../posts/service/posts-model-provider');
import EntityListCategoryDictionary = require('../../stats/dictionary/entity-list-category-dictionary');
import QueryFilterService = require('../../api/filters/query-filter-service');
import UsersModelProvider = require('../users-model-provider');
import PostsRepository = require('../../posts/posts-repository');
import OrganizationPostProcessor = require('../../organizations/service/organization-post-processor');
import EntityNotificationsRepository = require('../../entities/repository/entity-notifications-repository');
import UsersActivityRepository = require('../repository/users-activity-repository');
import OrganizationsRepository = require('../../organizations/repository/organizations-repository');
import UserActivityService = require('../user-activity-service');
import UsersActivityTrustRepository = require('../repository/users-activity/users-activity-trust-repository');
import AirdropsUsersExternalDataRepository = require('../../airdrops/repository/airdrops-users-external-data-repository');
import OffersModel = require('../../affiliates/models/offers-model');
import StreamsRepository = require('../../affiliates/repository/streams-repository');
import ConversionsRepository = require('../../affiliates/repository/conversions-repository');
import UsersQueryBuilderService = require('./users-fetch-query-builder-service');
import UsersActivityFollowRepository = require('../repository/users-activity/users-activity-follow-repository');
import UsersActivityVoteRepository = require('../repository/users-activity/users-activity-vote-repository');

class UsersFetchService {
  public static async findOneAndProcessFully(
    userId: number,
    currentUserId: number | null,
  ): Promise<UserModel> {
    const [user, activityData, userOrganizations] = await Promise.all([
      UsersRepository.getUserById(userId),
      UsersActivityRepository.findOneUserActivityWithInvolvedUsersData(userId),
      OrganizationsRepository.findAllAvailableForUser(userId),
    ]);

    if (!user) {
      throw new BadRequestError(`There is no user with ID: ${userId}`, 404);
    }

    const userJson = user.toJSON();

    UserPostProcessor.processUosAccountsProperties(userJson);
    UserPostProcessor.processUsersCurrentParams(userJson);

    userJson.organizations = userOrganizations;


    const activityDataSet = {
      myselfData: {
        trust: false,
      },
      activityData,
    };

    if (currentUserId) {
      activityDataSet.myselfData.trust = await UsersActivityTrustRepository.doesUserTrustUser(currentUserId, userId);
    }

    UserPostProcessor.processUserWithActivityDataSet(userJson, currentUserId, activityDataSet);
    OrganizationPostProcessor.processManyOrganizations(userJson.organizations);

    if (userId === currentUserId) {
      await this.addCurrentUserData(userJson);
    }

    return userJson;
  }

  public static async findOneAndProcessForCard(
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

  public static async findOneUserActivity(
    userId: number,
    query: UsersActivityQueryDto,
    currentUserId: number | null,
  ): Promise<UsersListResponse> {
    const repository  = UsersRepository;
    const params      = QueryFilterService.getQueryParametersWithRepository(query, repository, true, false, true);

    const promises: Promise<any>[]  =
      UsersQueryBuilderService.getPromisesByActivityType(query, userId, params);

    return this.findAllAndProcessForListByParams(promises, query, params, currentUserId);
  }

  public static async findOneContentVotingUsers(
    query: OneContentActivityUsersQueryDto,
    currentUserId: number | null,
  ): Promise<UsersListResponse> {
    const repository  = UsersRepository;
    const params      = QueryFilterService.getQueryParametersWithRepository(query, repository, true, false, true);

    const { interaction_type } = query;

    const promises = [
      UsersRepository.findAllWhoVoteContent(query.entity_id, query.entity_name, params, interaction_type),
      UsersActivityVoteRepository.countUsersThatVoteContent(query.entity_id, query.entity_name, interaction_type),
    ];

    return this.findAllAndProcessForListByParams(promises, query, params, currentUserId);
  }

  public static async findManyOrganizationFollowers(
    organizationId: number,
    query:          UsersActivityQueryDto,
    currentUserId:  number | null,
  ): Promise<UsersListResponse> {
    const repository  = UsersRepository;
    const params      = QueryFilterService.getQueryParametersWithRepository(query, repository, true, false, true);

    const promises: Promise<any>[] = [
      UsersRepository.findAllWhoFollowsOrganization(organizationId, params),
      UsersActivityFollowRepository.countUsersThatFollowOrganization(organizationId),
    ];

    return this.findAllAndProcessForListByParams(promises, query, params, currentUserId);
  }

  /**
   * @deprecated
   * @see findAllAndProcessForList
   * @param query
   * @param currentUserId
   */
  public static async findAllAndProcessForListLegacyRest(
    query: RequestQueryDto,
    currentUserId: number | null,
  ): Promise<UsersListResponse> {
    const repository  = UsersRepository;
    const params      = QueryFilterService.getQueryParametersWithRepository(query, repository);

    const promises = [
      repository.findAllForList(params),
      repository.countAll(params),
    ];

    return this.findAllAndProcessForListByParams(promises, query, params, currentUserId);
  }

  public static async findAllAndProcessForList(
    query: RequestQueryDto,
    currentUserId: number | null,
  ): Promise<UsersListResponse> {
    let data;
    if (query.overview_type && query.entity_name) {
      data = this.getManyUsersListAsRelatedToEntityPromises(query, query.entity_name);
    } else {
      data = this.getManyUsersListPromisesKnex(query);
    }

    return this.findAllAndProcessForListByParams(data.promises, query, data.params, currentUserId);
  }

  public static async findAllAirdropParticipants(
    query: UsersRequestQueryDto,
    currentUserId: number | null,
  ): Promise<UsersListResponse> {
    const repository          = UsersRepository;
    const params: DbParamsDto =
      QueryFilterService.getQueryParametersWithRepository(query, repository, true, false, true);

    const promises = [
      UsersRepository.findAllAirdropParticipants(query.airdrops!.id, params),
      AirdropsUsersExternalDataRepository.countAllParticipants(query.airdrops!.id),
    ];

    return this.findAllAndProcessForListByParams(promises, query, params, currentUserId);
  }

  /**
   *
   * @param {string} tagTitle
   * @param {Object} query
   * @param {number} currentUserId
   * @returns {Promise<*>}
   */
  public static async findAllAndProcessForListByTagTitle(tagTitle, query, currentUserId) {
    QueryFilterService.checkLastIdExistence(query);

    const repository    = UsersRepository;
    const params          = QueryFilterService.getQueryParametersWithRepository(query, repository);

    const [models, totalAmount] = await Promise.all([
      repository.findAllByTagTitle(tagTitle, params),
      repository.countAllByTagTitle(tagTitle),
    ]);

    if (currentUserId) {
      const activityData = await UserActivityService.getUserFollowActivityData(currentUserId);
      UserPostProcessor.addMyselfFollowDataByActivityArrays(models, activityData);
    }

    ApiPostProcessor.processUsersAfterQuery(models);
    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      metadata,
      data: models,
    };
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

    const relEntityField = 'user_id';

    const statsFieldName = EntityListCategoryDictionary.getStatsFieldByOverviewType(query.overview_type!);
    const promises = [
      UsersRepository.findManyAsRelatedToEntity(params, statsFieldName, relEntityField, query.overview_type!, entityName),
      UsersRepository.countManyUsersAsRelatedToEntity(params, statsFieldName, relEntityField, query.overview_type!),
    ];

    return {
      promises,
      params,
    };
  }

  private static getManyUsersListPromisesKnex(
    query: RequestQueryDto,
  ): { promises: Promise<any>[], params: DbParamsDto } {
    const params = QueryFilterService.getQueryParametersWithRepository(
      query,
      UsersRepository,
      true,
      false,
      true,
    );

    const promises = [
      UsersRepository.findManyForListViaKnex(query, params),
      UsersRepository.countManyForListViaKnex(query, params),
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
    currentUserId: number | null,
  ) {
    const [models, totalAmount] = await Promise.all(promises);

    if (currentUserId) {
      const activityData = await UserActivityService.getUserFollowActivityData(currentUserId);
      UserPostProcessor.addMyselfFollowDataByActivityArrays(models, activityData);
    }

    ApiPostProcessor.processUsersAfterQuery(models);
    const metadata = QueryFilterService.getMetadata(totalAmount, query, params);

    return {
      metadata,
      data: models,
    };
  }

  private static async addCurrentUserData(user: UserModel): Promise<void> {
    user.unread_messages_count =
      await EntityNotificationsRepository.countUnreadMessages(user.id);

    await this.addAffiliatesData(user);
  }

  private static async addAffiliatesData(user: UserModel): Promise<void> {
    user.affiliates = {
      referral_redirect_url: null,
      source_user: null,
    };

    const offer = await OffersModel.query().findOne('event_id', EventsIds.registration());
    if (!offer) {
      return;
    }

    user.affiliates.referral_redirect_url = await StreamsRepository.getRedirectUrl(offer, user.id);

    const sourceUserId = await ConversionsRepository.findSourceUserIdBySuccessUserConversion(offer, user);

    if (sourceUserId) {
      user.affiliates.source_user = await this.findOneAndProcessForCard(sourceUserId);
    }
  }
}

export = UsersFetchService;
