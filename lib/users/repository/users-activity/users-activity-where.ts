import { EventsIdsDictionary, InteractionTypesDictionary } from 'ucom.libs.common';
import { ActivityConditionsDto } from '../../interfaces/users-activity/dto-interfaces';

import UsersModelProvider = require('../../users-model-provider');

import ActivityGroupDictionary = require('../../../activity/activity-group-dictionary');

class UsersActivityWhere {
  public static getUpvoteFilter() {
    return {
      activity_type_id:   InteractionTypesDictionary.getUpvoteId(),
      activity_group_id:  ActivityGroupDictionary.getGroupContentInteraction(),
    };
  }

  public static getDownvoteFilter() {
    return {
      activity_type_id:   InteractionTypesDictionary.getDownvoteId(),
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
      activity_type_id: InteractionTypesDictionary.getTrustId(),
      activity_group_id: ActivityGroupDictionary.getGroupUserUserInteraction(),
      event_id: EventsIdsDictionary.getUserTrustsYou(),
    };
  }

  private static getWhereUntrustUser(): ActivityConditionsDto {
    return {
      activity_type_id: InteractionTypesDictionary.getUntrustId(),
      activity_group_id: ActivityGroupDictionary.getGroupUserUserInteraction(),
      event_id: EventsIdsDictionary.getUserUntrustsYou(),
    };
  }
}

export = UsersActivityWhere;
