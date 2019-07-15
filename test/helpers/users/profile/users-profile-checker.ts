import { UserModel } from '../../../../lib/users/interfaces/model-interfaces';

import knex = require('../../../../config/knex');
import UsersModelProvider = require('../../../../lib/users/users-model-provider');
import ActivityGroupDictionary = require('../../../../lib/activity/activity-group-dictionary');
import CommonChecker = require('../../common/common-checker');
import UsersActivityCommonHelper = require('../activity/users-activity-common-helper');

const { EventsIds } = require('ucom.libs.common').Events.Dictionary;

class UsersProfileChecker {
  public static async checkProfileUpdating(
    myself: UserModel,
    eventId: number = EventsIds.userUpdatesProfile(),
  ): Promise<void> {
    const activity = await knex(UsersModelProvider.getUsersActivityTableName())
      .where({
        activity_type_id:   ActivityGroupDictionary.getUserProfile(),
        activity_group_id:  ActivityGroupDictionary.getUserProfile(),
        user_id_from:       myself.id,
        entity_id_to:       myself.id,
        entity_name:        UsersModelProvider.getEntityName(),
        event_id:           eventId,
      });

    CommonChecker.expectOnlyOneNotEmptyItem(activity);
    await UsersActivityCommonHelper.getProcessedActivity(myself.id, eventId);
  }
}

export = UsersProfileChecker;
