import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlRequestHelper } from '../common/graphql-request-helper';

import ResponseHelper = require('../../integration/helpers/response-helper');

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

class OneOrganizationRequest {
  public static async getOneOrganizationIsFollowedBy(
    myself: UserModel,
    organization_identity: string | number,
    orderBy: string = '-scaled_importance',
    page: number = 1,
    perPage: number = 10,
  ): Promise<any> {
    const params = {
      filters: {
        organization_identity: `${organization_identity}`,
        activity: 'followed_by',
      },
      order_by: orderBy,
      page,
      per_page: perPage,
    };

    const part: string  = GraphQLSchema.getOneOrganizationActivityQueryPart(params);
    const key: string   = 'one_organization_activity';
    const response      = await GraphqlRequestHelper.makeRequestFromOneQueryPartByFetch(part, key, myself);

    ResponseHelper.checkListResponseStructure(response);

    return response;
  }
}

export = OneOrganizationRequest;
