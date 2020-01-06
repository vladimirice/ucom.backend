import { Request } from 'express';
import { EntityNames } from 'ucom.libs.common';
import { PostModelResponse } from '../../posts/interfaces/model-interfaces';
import { UserModel } from '../../users/interfaces/model-interfaces';
import { StringToAnyCollection } from '../interfaces/common-types';

import UsersActivityEventsViewRepository = require('../../users/repository/users-activity/users-activity-events-view-repository');

class ApiPostEvents {
  public static async processForPostAndChangeProps(
    currentUserId: number | null,
    postModelResponse: PostModelResponse,
    request: Request,
  ): Promise<void> {
    await UsersActivityEventsViewRepository.insertOneView(
      currentUserId,
      postModelResponse.id,
      EntityNames.POSTS,
      request.headers,
    );

    this.incrementViewsCount(postModelResponse);
  }

  public static async processForOrganizationAndChangeProps(
    currentUserId: number | null,
    organization: StringToAnyCollection,
    request: Request,
  ): Promise<void> {
    await UsersActivityEventsViewRepository.insertOneView(
      currentUserId,
      organization.id,
      EntityNames.ORGANIZATIONS,
      request.headers,
    );

    this.incrementViewsCount(organization);
  }

  public static async processForTagAndChangeProps(
    currentUserId: number | null,
    tag: StringToAnyCollection,
    request: Request,
  ): Promise<void> {
    await UsersActivityEventsViewRepository.insertOneView(
      currentUserId,
      tag.id,
      EntityNames.TAGS,
      request.headers,
    );

    this.incrementViewsCount(tag);
  }

  public static async processForUserProfileAndChangeProps(
    currentUserId: number | null,
    user: UserModel,
    request: Request,
  ) {
    await UsersActivityEventsViewRepository.insertOneView(
      currentUserId,
      user.id,
      EntityNames.USERS,
      request.headers,
    );

    this.incrementViewsCount(user);
  }

  private static incrementViewsCount(entity: StringToAnyCollection): void {
    entity.views_count += 1;
  }
}

export = ApiPostEvents;
