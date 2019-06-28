"use strict";
const errors_1 = require("../../api/errors");
const _ = require("lodash");
const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const UsersRepository = require("../users-repository");
const UserPostProcessor = require("../user-post-processor");
const ApiPostProcessor = require("../../common/service/api-post-processor");
const PostsModelProvider = require("../../posts/service/posts-model-provider");
const EntityListCategoryDictionary = require("../../stats/dictionary/entity-list-category-dictionary");
const QueryFilterService = require("../../api/filters/query-filter-service");
const UsersModelProvider = require("../users-model-provider");
const PostsRepository = require("../../posts/posts-repository");
const OrganizationPostProcessor = require("../../organizations/service/organization-post-processor");
const EntityNotificationsRepository = require("../../entities/repository/entity-notifications-repository");
const UsersActivityRepository = require("../repository/users-activity-repository");
const OrganizationsRepository = require("../../organizations/repository/organizations-repository");
const UserActivityService = require("../user-activity-service");
const UsersActivityTrustRepository = require("../repository/users-activity/users-activity-trust-repository");
const AirdropsUsersExternalDataRepository = require("../../airdrops/repository/airdrops-users-external-data-repository");
const OffersModel = require("../../affiliates/models/offers-model");
const StreamsRepository = require("../../affiliates/repository/streams-repository");
const ConversionsRepository = require("../../affiliates/repository/conversions-repository");
const UsersQueryBuilderService = require("./users-fetch-query-builder-service");
const UsersActivityFollowRepository = require("../repository/users-activity/users-activity-follow-repository");
class UsersFetchService {
    static async findOneAndProcessFully(userId, currentUserId) {
        const [user, activityData, userOrganizations] = await Promise.all([
            UsersRepository.getUserById(userId),
            UsersActivityRepository.findOneUserActivityWithInvolvedUsersData(userId),
            OrganizationsRepository.findAllAvailableForUser(userId),
        ]);
        if (!user) {
            throw new errors_1.BadRequestError(`There is no user with ID: ${userId}`, 404);
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
    static async findOneAndProcessForCard(userId) {
        const model = await UsersRepository.findOneByIdForPreview(userId);
        if (!model) {
            return null;
        }
        UserPostProcessor.processOnlyUserItself(model);
        return model;
    }
    static async findManyAndProcessForCard(usersIds) {
        const modelsSet = await UsersRepository.findManyUsersByIdForCard(usersIds);
        UserPostProcessor.processUserIdToUserModelCard(modelsSet);
        return modelsSet;
    }
    static async findOneUserActivity(userId, query, currentUserId) {
        const repository = UsersRepository;
        const params = QueryFilterService.getQueryParametersWithRepository(query, repository, true, false, true);
        const promises = UsersQueryBuilderService.getPromisesByActivityType(query, userId, params);
        return this.findAllAndProcessForListByParams(promises, query, params, currentUserId);
    }
    static async findManyOrganizationFollowers(organizationId, query, currentUserId) {
        const repository = UsersRepository;
        const params = QueryFilterService.getQueryParametersWithRepository(query, repository, true, false, true);
        const promises = [
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
    static async findAllAndProcessForListLegacyRest(query, currentUserId) {
        const repository = UsersRepository;
        const params = QueryFilterService.getQueryParametersWithRepository(query, repository);
        const promises = [
            repository.findAllForList(params),
            repository.countAll(params),
        ];
        return this.findAllAndProcessForListByParams(promises, query, params, currentUserId);
    }
    static async findAllAndProcessForList(query, currentUserId) {
        let data;
        if (query.overview_type && query.entity_name) {
            data = this.getManyUsersListAsRelatedToEntityPromises(query, query.entity_name);
        }
        else {
            data = this.getManyUsersListPromisesKnex(query);
        }
        return this.findAllAndProcessForListByParams(data.promises, query, data.params, currentUserId);
    }
    static async findAllAirdropParticipants(query, currentUserId) {
        const repository = UsersRepository;
        const params = QueryFilterService.getQueryParametersWithRepository(query, repository, true, false, true);
        const promises = [
            UsersRepository.findAllAirdropParticipants(query.airdrops.id, params),
            AirdropsUsersExternalDataRepository.countAllParticipants(query.airdrops.id),
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
    static async findAllAndProcessForListByTagTitle(tagTitle, query, currentUserId) {
        QueryFilterService.checkLastIdExistence(query);
        const repository = UsersRepository;
        const params = QueryFilterService.getQueryParametersWithRepository(query, repository);
        const [models, totalAmount] = await Promise.all([
            repository.findAllByTagTitle(tagTitle, params),
            repository.countAllByTagTitle(tagTitle),
        ]);
        if (currentUserId) {
            const activityData = await UserActivityService.getUserActivityData(currentUserId);
            UserPostProcessor.addMyselfDataByActivityArrays(models, activityData);
        }
        ApiPostProcessor.processUsersAfterQuery(models);
        const metadata = QueryFilterService.getMetadata(totalAmount, query, params);
        return {
            metadata,
            data: models,
        };
    }
    static getManyUsersListAsRelatedToEntityPromises(query, entityName) {
        if (entityName !== PostsModelProvider.getEntityName()) {
            throw new errors_1.AppError(`Unsupported entityName: ${entityName}`, 500);
        }
        if (!query.post_type_id) {
            throw new errors_1.AppError('post_type_id parameter is required', 400);
        }
        const relatedRepository = PostsRepository;
        const orderByRelationMap = relatedRepository.getOrderByRelationMap(false);
        const allowedOrderBy = relatedRepository.getAllowedOrderBy();
        const whereProcessor = relatedRepository.getWhereProcessor();
        let params = QueryFilterService.getQueryParameters(query, orderByRelationMap, allowedOrderBy, whereProcessor);
        params = _.defaults(params, UsersRepository.getDefaultListParams());
        QueryFilterService.processAttributes(params, UsersModelProvider.getTableName(), true);
        const relEntityField = 'user_id';
        const statsFieldName = EntityListCategoryDictionary.getStatsFieldByOverviewType(query.overview_type);
        const promises = [
            UsersRepository.findManyAsRelatedToEntity(params, statsFieldName, relEntityField, query.overview_type, entityName),
            UsersRepository.countManyUsersAsRelatedToEntity(params, statsFieldName, relEntityField, query.overview_type),
        ];
        return {
            promises,
            params,
        };
    }
    static getManyUsersListPromisesKnex(query) {
        const params = QueryFilterService.getQueryParametersWithRepository(query, UsersRepository, true, false, true);
        const promises = [
            UsersRepository.findManyForListViaKnex(query, params),
            UsersRepository.countManyForListViaKnex(query, params),
        ];
        return {
            promises,
            params,
        };
    }
    static async findAllAndProcessForListByParams(promises, query, params, currentUserId) {
        const [models, totalAmount] = await Promise.all(promises);
        if (currentUserId) {
            const activityData = await UserActivityService.getUserActivityData(currentUserId);
            UserPostProcessor.addMyselfDataByActivityArrays(models, activityData);
        }
        ApiPostProcessor.processUsersAfterQuery(models);
        const metadata = QueryFilterService.getMetadata(totalAmount, query, params);
        return {
            metadata,
            data: models,
        };
    }
    static async addCurrentUserData(user) {
        user.unread_messages_count =
            await EntityNotificationsRepository.countUnreadMessages(user.id);
        await this.addAffiliatesData(user);
    }
    static async addAffiliatesData(user) {
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
module.exports = UsersFetchService;
