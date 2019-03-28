import { ActivityConditionsDto } from '../../interfaces/users-activity/dto-interfaces';

const { InteractionTypeDictionary } = require('ucom-libs-social-transactions');

import UsersModelProvider = require('../../users-model-provider');

import ActivityGroupDictionary = require('../../../activity/activity-group-dictionary');
import NotificationsEventIdDictionary = require('../../../entities/dictionary/notifications-event-id-dictionary');

class UsersActivityWhere {
  public static getUpvoteFilter() {
    return {
      activity_type_id:   InteractionTypeDictionary.getUpvoteId(),
      activity_group_id:  ActivityGroupDictionary.getGroupContentInteraction(),
    };
  }

  public static getDownvoteFilter() {
    return {
      activity_type_id:   InteractionTypeDictionary.getDownvoteId(),
      activity_group_id:  ActivityGroupDictionary.getGroupContentInteraction(),
    };
  }

  public static getWhereTrustOneUser(userIdFrom: number, userIdTo: number) {
    const activityWhere = this.getWhereTrustUser();
    const entityToWhere = this.getWhereEntityUser(userIdTo);

    return {
      user_id_from: userIdFrom,

      ...activityWhere,
      ...entityToWhere,
    };
  }

  public static getWhereUntrustOneUser(userIdFrom: number, userIdTo: number) {
    const activityWhere = this.getWhereUntrustUser();
    const entityToWhere = this.getWhereEntityUser(userIdTo);

    return {
      user_id_from: userIdFrom,

      ...activityWhere,
      ...entityToWhere,
    };
  }

  private static getWhereEntityUser(userId: number) {
    return {
      entity_id_to: userId,
      entity_name: UsersModelProvider.getEntityName(),
    };
  }

  private static getWhereTrustUser(): ActivityConditionsDto {
    return {
      activity_type_id: InteractionTypeDictionary.getTrustId(),
      activity_group_id: ActivityGroupDictionary.getGroupUserUserInteraction(),
      event_id: NotificationsEventIdDictionary.getUserTrustsYou(),
    };
  }

  private static getWhereUntrustUser(): ActivityConditionsDto {
    return {
      activity_type_id: InteractionTypeDictionary.getUntrustId(),
      activity_group_id: ActivityGroupDictionary.getGroupUserUserInteraction(),
      event_id: NotificationsEventIdDictionary.getUserUntrustsYou(),
    };
  }
}

export = UsersActivityWhere;
