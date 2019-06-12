"use strict";
const EventParamTypeDictionary = require("../dictionary/event-param/event-param-type-dictionary");
const PostsRepository = require("../../posts/posts-repository");
const CommonStatsJob = require("./common-stats-job");
const UsersModelProvider = require("../../users/users-model-provider");
const UosAccountsPropertiesRepository = require("../../uos-accounts-properties/repository/uos-accounts-properties-repository");
const UosAccountsModelProvider = require("../../uos-accounts-properties/service/uos-accounts-model-provider");
const params = {
    entityName: UsersModelProvider.getEntityName(),
    entityLabel: UsersModelProvider.getTableName(),
    currentValuesFetchFunction: UosAccountsPropertiesRepository.findManyForEntityEvents,
    currentValuesEventType: EventParamTypeDictionary.getUserHimselfCurrentAmounts(),
    currentValuesToSave: UosAccountsModelProvider.getFieldsToSelect(),
};
class UsersStatsJob {
    static async processCurrentValues(batchSize = 500) {
        const data = await PostsRepository.getManyUsersPostsAmount();
        const eventType = EventParamTypeDictionary.getUsersPostsCurrentAmount();
        await CommonStatsJob.calculatePostsCurrentAmount(data, eventType, params.entityName, params.entityLabel);
        await CommonStatsJob.saveCurrentValues(params, batchSize);
    }
}
module.exports = UsersStatsJob;
