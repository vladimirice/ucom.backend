const { EventsIds } = require('ucom.libs.common').Events.Dictionary;
const { ContentTypeDictionary } = require('ucom-libs-social-transactions');

class PostToEventIdService {
  public static getCreateMediaPostEventId(body: any): number {
    return body.organization_id ?
      EventsIds.userCreatesMediaPostFromOrganization() :
      EventsIds.userCreatesMediaPostFromHimself();
  }

  public static getUpdatingEventIdByPost(post): number | null {
    if (post.post_type_id !== ContentTypeDictionary.getTypeMediaPost()) {
      return null;
    }

    if (post.organization_id === null) {
      return EventsIds.userUpdatesMediaPostFromHimself();
    }

    return EventsIds.userUpdatesMediaPostFromOrganization();
  }
}

export = PostToEventIdService;
