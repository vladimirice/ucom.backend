import { EventsIdsDictionary } from 'ucom.libs.common';
import { CommentModel } from '../interfaces/model-interfaces';

class CommentToEventIdService {
  public static getUpdatingEventIdByPost(comment: CommentModel): number {
    if (comment.organization_id === null) {
      return EventsIdsDictionary.userUpdatesCommentFromAccount();
    }

    return EventsIdsDictionary.userUpdatesCommentFromOrganization();
  }
}

export = CommentToEventIdService;
