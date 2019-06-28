import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import knex = require('../../../config/knex');
import UsersModelProvider = require('../../../lib/users/users-model-provider');
import NumbersHelper = require('../../../lib/common/helper/numbers-helper');

class UsersDirectSetter {
  public static async setAllCurrentParamsForUser(user: UserModel): Promise<void> {
    await Promise.all([
      this.setPositivePostsTotalAmountDelta(user),
      this.setPositiveScaledImportanceDelta(user),
      this.setPositiveScaledSocialRateDelta(user),
    ]);
  }

  public static async setPositivePostsTotalAmountDelta(user: UserModel): Promise<number> {
    return this.setPositiveDeltaParamForOneUser('posts_total_amount_delta', user, false);
  }

  public static async setPositiveScaledSocialRateDelta(user: UserModel): Promise<number> {
    return this.setPositiveDeltaParamForOneUser('scaled_social_rate_delta', user, true);
  }

  public static async setPositiveScaledImportanceDelta(user: UserModel): Promise<number> {
    return this.setPositiveDeltaParamForOneUser('scaled_importance_delta', user, true);
  }

  private static async setPositiveDeltaParamForOneUser(
    param: string,
    user: UserModel,
    isFloat: boolean,
  ): Promise<number> {
    let valueToSet;
    if (isFloat) {
      valueToSet = NumbersHelper.generateRandomNumber(0.001, 0.01, 10);
    } else {
      valueToSet = NumbersHelper.generateRandomInteger(1, 10);
    }

    await knex(UsersModelProvider.getCurrentParamsTableName())
      .update({
        [param]: valueToSet,
      })
      .where({
        user_id: user.id,
      });

    return valueToSet;
  }
}

export = UsersDirectSetter;
