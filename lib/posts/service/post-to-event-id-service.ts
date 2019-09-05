import { ContentTypesDictionary } from 'ucom.libs.common';
import { PostModel } from '../interfaces/model-interfaces';
import { AppError } from '../../api/errors';

const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const { EntityNames } = require('ucom.libs.common').Common.Dictionary;

class PostToEventIdService {
  public static getCreateMediaPostEventId(body: any): number {
    return body.organization_id ?
      EventsIds.userCreatesMediaPostFromOrganization() :
      EventsIds.userCreatesMediaPostFromHimself();
  }

  public static getUpdatingEventIdByPost(post: PostModel): number | null {
    if (post.post_type_id === ContentTypesDictionary.getTypeDirectPost()) {
      return this.getUpdateDirectPostEventId(post);
    }

    if (post.post_type_id !== ContentTypesDictionary.getTypeMediaPost()) {
      return null;
    }

    if (post.organization_id === null) {
      return EventsIds.userUpdatesMediaPostFromHimself();
    }

    return EventsIds.userUpdatesMediaPostFromOrganization();
  }

  private static getUpdateDirectPostEventId(post: PostModel): number {
    const map = {
      [EntityNames.USERS]:          EventsIds.userUpdatesDirectPostForUser(),
      [EntityNames.ORGANIZATIONS]:  EventsIds.userUpdatesDirectPostForOrganization(),
    };

    const eventId = map[post.entity_name_for];

    if (!eventId) {
      throw new AppError(`Unsupported entity_name_for: ${post.entity_name_for}`);
    }

    return eventId;
  }
}

export = PostToEventIdService;
