"use strict";
const OrganizationsFetchDiscussions = require("../discussions/service/organizations-fetch-discussions");
const OrganizationsRepository = require("../repository/organizations-repository");
const EntitySourceService = require("../../entities/service/entity-sources-service");
const OrganizationsModelProvider = require("./organizations-model-provider");
const UsersActivityRepository = require("../../users/repository/users-activity-repository");
const ActivityGroupDictionary = require("../../activity/activity-group-dictionary");
const ApiPostProcessor = require("../../common/service/api-post-processor");
const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');
class OrganizationService {
    static async findOneOrgByIdAndProcess(modelId, currentUser) {
        const where = {
            id: modelId,
        };
        const modelsToInclude = [
            'Users',
            'users_team',
        ];
        const model = await OrganizationsRepository.findOneBy(where, modelsToInclude);
        const entitySources = await EntitySourceService.findAndGroupAllEntityRelatedSources(modelId, OrganizationsModelProvider.getEntityName());
        const activityData = await UsersActivityRepository.findEntityRelatedActivityWithInvolvedUsersData(modelId, OrganizationsModelProvider.getEntityName(), InteractionTypeDictionary.getFollowId(), ActivityGroupDictionary.getGroupContentInteraction());
        const currentUserId = currentUser ? currentUser.id : null;
        ApiPostProcessor.processOneOrgFully(model, currentUserId, activityData);
        // #refactor. Add to the model inside EntitySourceService
        model.social_networks = entitySources.social_networks;
        model.community_sources = entitySources.community_sources;
        model.partnership_sources = entitySources.partnership_sources;
        model.discussions =
            await OrganizationsFetchDiscussions.getManyDiscussions(model.id);
        return {
            data: model,
            metadata: [],
        };
    }
}
module.exports = OrganizationService;
