import { GraphqlRequestHelper } from '../common/graphql-request-helper';
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

class OneUserRequestHelper {
  public static async getOneUserAsMyself(
    myself: UserModel,
    userId: number,
  ): Promise<any> {
    const filter = {
      user_id: userId,
    };

    const query = GraphQLSchema.getOneUser(filter);
    const key: string = 'one_user';

    return GraphqlRequestHelper.makeRequestAsMyself(myself, query, key, false);
  }
}

export = OneUserRequestHelper;
