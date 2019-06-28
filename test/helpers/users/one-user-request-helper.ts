import { GraphqlRequestHelper } from '../common/graphql-request-helper';
import { UserModel, UsersListResponse } from '../../../lib/users/interfaces/model-interfaces';
import { IResponseBody } from '../../../lib/common/interfaces/request-interfaces';

import ResponseHelper = require('../../integration/helpers/response-helper');
import RequestHelper = require('../../integration/helpers/request-helper');

const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

const supertest = require('supertest');

class OneUserRequestHelper {
  public static async deleteAllFromArray(myself: UserModel, field: string): Promise<IResponseBody> {
    const res = await supertest(RequestHelper.getApiApplication())
      .patch(RequestHelper.getMyselfUrl())
      .set('Authorization', `Bearer ${myself.token}`)
      .field(`${field}[]`, '')
    ;

    ResponseHelper.expectStatusOk(res);

    return res.body;
  }

  public static async getMyself(myself: UserModel): Promise<IResponseBody> {
    const request = await RequestHelper.getGetRequestAsMyself(RequestHelper.getMyselfUrl(), myself);

    return request.body;
  }

  public static async getOneUserAsMyself(
    myself: UserModel,
    userId: number,
    givenFilters: any | null = null,
  ): Promise<any> {
    const filters = givenFilters || {
      user_id: userId,
    };

    const params = {
      filters,
    };

    const query = GraphQLSchema.getOneUserQuery(params);
    const key: string = 'one_user';

    return GraphqlRequestHelper.makeRequestAsMyself(myself, query, key, false);
  }

  public static async getOneUserWithTrustedByAsMyself(
    myself: UserModel,
    userId: number,
  ): Promise<any> {
    const oneUserParams = {
      filters: {
        user_id: userId,
      },
    };

    const trustedByParams = {
      filters: {
        user_id: userId,
      },
      order_by: '-id',
      page: 1,
      per_page: 10,
    };

    const parts: string[] = [];

    parts.push(GraphQLSchema.getOneUserQueryPart(oneUserParams));
    parts.push(GraphQLSchema.getOneUserTrustedByQueryPart(trustedByParams));

    return GraphqlRequestHelper.makeRequestFromQueryPartsAsMyself(myself, parts);
  }

  public static async getOneUserTrustedByAsMyself(
    myself: UserModel,
    userId: number,
    orderBy: string = '-current_rate',
  ): Promise<any> {
    const params = {
      filters: {
        user_id: userId,
      },
      order_by: orderBy,
      page: 1,
      per_page: 10,
    };

    const trustedByPart = GraphQLSchema.getOneUserTrustedByQueryPart(params);

    const query = GraphQLSchema.getQueryMadeFromParts([trustedByPart]);
    const key: string = 'one_user_trusted_by';

    const response = await GraphqlRequestHelper.makeRequestAsMyself(myself, query, key, false);

    ResponseHelper.checkListResponseStructure(response);

    return response;
  }

  public static async getOneUserTrustedByAsGuest(
    userId: number,
    orderBy: string = '-current_rate',
  ): Promise<any> {
    const params = {
      filters: {
        user_id: userId,
      },
      order_by: orderBy,
      page: 1,
      per_page: 10,
    };

    const trustedByPart = GraphQLSchema.getOneUserTrustedByQueryPart(params);

    const query = GraphQLSchema.getQueryMadeFromParts([trustedByPart]);
    const key: string = 'one_user_trusted_by';

    const response = await GraphqlRequestHelper.makeRequestAsGuest(query, key, false);

    ResponseHelper.checkListResponseStructure(response);

    return response;
  }

  public static async getOneUserFollowedBy(
    user: UserModel,
    orderBy: string = '-current_rate',
    myself: UserModel | null = null,
  ): Promise<UsersListResponse> {
    const params = {
      filters: {
        user_identity: `${user.id}`,
        activity: 'followed_by',
      },
      order_by: orderBy,
      page: 1,
      per_page: 10,
    };

    const part        = GraphQLSchema.getOneUserActivityQueryPart(params);
    const keyToReturn = 'one_user_activity';

    return GraphqlRequestHelper.makeRequestFromOneQueryPartByFetch(part, keyToReturn, myself);
  }

  public static async getOneUserFollowsOtherUsers(
    user: UserModel,
    orderBy: string = '-current_rate',
    myself: UserModel | null = null,
  ): Promise<UsersListResponse> {
    const params = {
      filters: {
        user_identity:  `${user.id}`,
        activity:       'I_follow',
      },
      order_by: orderBy,
      page: 1,
      per_page: 10,
    };

    const part        = GraphQLSchema.getOneUserActivityQueryPart(params);
    const keyToReturn = 'one_user_activity';

    return GraphqlRequestHelper.makeRequestFromOneQueryPartByFetch(part, keyToReturn, myself);
  }

  public static async getOneUserAsGuest(
    userId: number,
  ): Promise<any> {
    const params = {
      filters: {
        user_id: userId,
      },
    };

    const query = GraphQLSchema.getOneUserQuery(params);
    const key: string = 'one_user';

    return GraphqlRequestHelper.makeRequestAsGuest(query, key, false);
  }
}

export = OneUserRequestHelper;
