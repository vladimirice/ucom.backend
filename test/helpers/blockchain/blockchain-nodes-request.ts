import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlRequestHelper } from '../common/graphql-request-helper';

import BlockchainNodesCommon = require('./blockchain-nodes-common');
import _ = require('lodash');
const { GraphQLSchema } = require('ucom-libs-graphql-schemas');
const { Dictionary } = require('ucom-libs-wallet');

const typeBlockProducer: number = Dictionary.BlockchainNodes.typeBlockProducer();

class BlockchainNodesRequest {
  public static async requestToBlockchainNodesOnly(myself: UserModel) {
    const partsWithAliases = {};
    BlockchainNodesRequest.addPartForNodes(partsWithAliases, 'block_producers', typeBlockProducer);

    const response = await GraphqlRequestHelper.makeRequestFromQueryPartsWithAliasesAsMyself(myself, partsWithAliases);

    return response.block_producers;
  }

  public static getCommonParams() {
    const orderBy = '-bp_status';
    const page = 1;
    const perPage = 10;

    return {
      page,
      order_by: orderBy,
      per_page: perPage,
    };
  }

  public static addPartForNodes(
    partsWithAliases: any,
    alias: string,
    blockchainNodesType: number,
    customParams: any = {},
  ): void {
    const commonParams = this.getCommonParams();

    const params = {
      ...commonParams,
      filters: {
        myself_votes_only: false,
        blockchain_nodes_type: blockchainNodesType,
      },
    };

    const resultParams = _.defaultsDeep(customParams, params);

    partsWithAliases[alias] = GraphQLSchema.getManyBlockchainNodesQueryPart(resultParams);
  }

  public static addPartForUserVotes(
    partsWithAliases: any,
    user: UserModel,
    blockchainNodesType: number,
    customParams: any = {},
  ): void {
    const commonParams = this.getCommonParams();

    const resultParams = {
      ...commonParams,
      ...customParams,
    };

    const alias = BlockchainNodesCommon.getGraphQlNodeAlias(user, blockchainNodesType);

    const params = {
      ...resultParams,
      filters: {
        myself_votes_only: true,
        user_id: user.id,
        blockchain_nodes_type: blockchainNodesType,
      },
    };

    partsWithAliases[alias] = GraphQLSchema.getManyBlockchainNodesQueryPart(params);
  }
}

export = BlockchainNodesRequest;
