import { BadRequestError } from '../../api/errors';

import OneUserInputValidator = require('../validator/one-user-input-validator');
import UsersRepository = require('../users-repository');

class OneUserInputProcessor {
  public static async getUserIdByFilters(filters: any): Promise<number> {
    const userId: number = filters.user_id;
    const userIdentity: string = filters.user_identity;

    if (userId && userIdentity) {
      throw new BadRequestError(`Please provide either user_id or user_identity filter. Provided filters: ${JSON.stringify(filters)}`);
    }

    if (!userId && !userIdentity) {
      throw new BadRequestError(`Please provide user_id or user_identity filter. Provided filters: ${JSON.stringify(filters)}`);
    }

    if (userIdentity) {
      return OneUserInputProcessor.getUserIdByIdentity(userIdentity);
    }

    return userId;
  }

  public static async getUserIdByIdentity(
    identity: string,
  ): Promise<number> {
    if (OneUserInputValidator.doesIdentityLooksLikeId(identity)) {
      return +identity;
    }
    const user = await UsersRepository.findOneByAccountNameAsObject(identity);
    if (!user) {
      throw new BadRequestError(`There is no user with account_name: ${identity}`);
    }

    return +user.id;
  }
}

export = OneUserInputProcessor;
