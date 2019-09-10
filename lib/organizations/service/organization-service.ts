import { EntityNames, InteractionTypesDictionary } from 'ucom.libs.common';
import { UserModel } from '../../users/interfaces/model-interfaces';

import OrganizationsFetchDiscussions = require('../discussions/service/organizations-fetch-discussions');
import OrganizationsRepository = require('../repository/organizations-repository');
import EntitySourceService = require('../../entities/service/entity-sources-service');
import OrganizationsModelProvider = require('./organizations-model-provider');
import UsersActivityRepository = require('../../users/repository/users-activity-repository');
import ActivityGroupDictionary = require('../../activity/activity-group-dictionary');
import ApiPostProcessor = require('../../common/service/api-post-processor');
import UsersActivityEventsViewRepository = require('../../users/repository/users-activity/users-activity-events-view-repository');

class OrganizationService {
  public static async findOneOrgByIdAndProcess(
    modelId: number,
    currentUser: UserModel | null,
  ): Promise<{data: any, metadata: any}> {
    const where = {
      id: modelId,
    };

    const modelsToInclude: string[] = [
      'Users',
      'users_team',
    ];

    const model = await OrganizationsRepository.findOneBy(where, modelsToInclude);

    const entitySources = await EntitySourceService.findAndGroupAllEntityRelatedSources(
      modelId,
      OrganizationsModelProvider.getEntityName(),
    );

    const activityData = await UsersActivityRepository.findEntityRelatedActivityWithInvolvedUsersData(
      modelId,
      OrganizationsModelProvider.getEntityName(),
      InteractionTypesDictionary.getFollowId(),
      ActivityGroupDictionary.getGroupContentInteraction(),
    );

    const currentUserId = currentUser ? currentUser.id : null;

    ApiPostProcessor.processOneOrgFully(model, currentUserId, activityData);

    // #refactor. Add to the model inside EntitySourceService
    model.social_networks      = entitySources.social_networks;
    model.community_sources    = entitySources.community_sources;
    model.partnership_sources  = entitySources.partnership_sources;

    model.discussions =
      await OrganizationsFetchDiscussions.getManyDiscussions(model.id);

    model.views_count = await UsersActivityEventsViewRepository.getViewsCountForEntity(
      model.id,
      EntityNames.ORGANIZATIONS,
    );

    return {
      data: model,
      metadata: [],
    };
  }
}

export = OrganizationService;
