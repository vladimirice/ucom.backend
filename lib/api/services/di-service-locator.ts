import { UserModel } from '../../users/interfaces/model-interfaces';

import PostService = require('../../posts/post-service');

class DiServiceLocator {
  public static getCurrentUserOrException(req): UserModel {
    const service = req.container.get('current-user');

    return service.getUserOrException();
  }

  public static getCurrentUserIdOrException(req): number {
    const service = req.container.get('current-user');

    return service.getCurrentUserIdOrException();
  }

  public static getPostsService(req: any): PostService {
    return req.container.get('post-service');
  }

  public static getOrganizationsService(req) {
    return req.container.get('organizations-service');
  }
}

export = DiServiceLocator;
