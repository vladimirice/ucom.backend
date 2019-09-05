"use strict";
const ucom_libs_common_1 = require("ucom.libs.common");
const OrganizationsFetchDiscussions = require("../discussions/service/organizations-fetch-discussions");
const OrganizationsRepository = require("../repository/organizations-repository");
const EntitySourceService = require("../../entities/service/entity-sources-service");
const OrganizationsModelProvider = require("./organizations-model-provider");
const UsersActivityRepository = require("../../users/repository/users-activity-repository");
const ActivityGroupDictionary = require("../../activity/activity-group-dictionary");
const ApiPostProcessor = require("../../common/service/api-post-processor");
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
        const activityData = await UsersActivityRepository.findEntityRelatedActivityWithInvolvedUsersData(modelId, OrganizationsModelProvider.getEntityName(), ucom_libs_common_1.InteractionTypesDictionary.getFollowId(), ActivityGroupDictionary.getGroupContentInteraction());
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
