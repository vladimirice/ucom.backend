"use strict";
const UsersRepository = require("../users-repository");
const UserPostProcessor = require("../user-post-processor");
const ApiPostProcessor = require("../../common/service/api-post-processor");
const usersRepository = require('../users-repository');
const queryFilterService = require('../../api/filters/query-filter-service');
const usersActivityService = require('../user-activity-service');
const userPostProcessor = require('../user-post-processor');
class UsersFetchService {
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
    /**
     *
     * @param {Object} query
     * @param {number|null} currentUserId
     * @returns {Promise<Object>}
     */
    static async findAllAndProcessForList(query, currentUserId) {
        // preparation for universal class-fetching processor
        const repository = usersRepository;
        const params = queryFilterService.getQueryParametersWithRepository(query, repository);
        const [models, totalAmount] = await Promise.all([
            repository.findAllForList(params),
            repository.countAll(params),
        ]);
        // end of future universal part
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
        const repository = usersRepository;
        const params = queryFilterService.getQueryParametersWithRepository(query, repository);
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
module.exports = UsersFetchService;
