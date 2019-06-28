import { UserModel } from '../../users/interfaces/model-interfaces';

import { AppError } from '../errors';

class DiServiceLocator {
  public static getCurrentUserOrException(req): UserModel {
    if (!req.currentUser) {
      throw new AppError('User must be defined or AuthMiddleware should be used beforehand');
    }

    return req.currentUser;
  }

  public static getCurrentUserIdOrException(req): number {
    const currentUser = this.getCurrentUserOrException(req);

    return currentUser.id;
  }

  public static getCurrentUserIdOrNull(req): number | null{
    const currentUser = req.currentUser;

    if (currentUser) {
      return currentUser.id;
    }

    return null;
  }

  public static getCurrentUserOrNull(req): UserModel | null{
    const currentUser = req.currentUser;

    return currentUser ? currentUser : null;
  }
}

export = DiServiceLocator;
