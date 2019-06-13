import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import knex = require('../../../config/knex');
import UsersModelProvider = require('../../../lib/users/users-model-provider');
import NumbersHelper = require('../../../lib/common/helper/numbers-helper');

class UsersDirectSetter {
  public static async setPositivePostsTotalAmountDelta(user: UserModel): Promise<number> {
    const valueToSet = NumbersHelper.generateRandomInteger(1, 10);

    await knex(UsersModelProvider.getCurrentParamsTableName())
      .update({
        posts_total_amount_delta: valueToSet,
      })
      .where({
        user_id: user.id,
      });

    return valueToSet;
  }

  public static async setPositiveScaledImportanceDelta(user: UserModel): Promise<number> {
    const valueToSet = NumbersHelper.generateRandomNumber(0.001, 0.01, 10);

    await knex(UsersModelProvider.getCurrentParamsTableName())
      .update({
        scaled_importance_delta: valueToSet,
      })
      .where({
        user_id: user.id,
      });

    return valueToSet;
  }
}

export = UsersDirectSetter;
