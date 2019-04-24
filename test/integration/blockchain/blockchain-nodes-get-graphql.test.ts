import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlRequestHelper } from '../../helpers/common/graphql-request-helper';

import SeedsHelper = require('../helpers/seeds-helper');
import BlockchainCacheService = require('../../../lib/eos/service/blockchain-cache-service');
import EosApi = require('../../../lib/eos/eosApi');
import ResponseHelper = require('../helpers/response-helper');
import BlockchainNodesChecker = require('../../helpers/blockchain/blockchain-nodes-checker');

const { Dictionary } = require('ucom-libs-wallet');
const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

let userVlad: UserModel;

const JEST_TIMEOUT = 10000;

const options = {
  isGraphQl: true,
  workersMocking: 'all',
};

EosApi.initWalletApi();

/**
 * interface checker - as for blockchain nodes
 *
 * get for guest
 * no myself data at all
 * condition - user does not have votes - use reset
 * condition - votes for bp only - use mock function
 * condition - votes for calculators - use mock function
 * condition - votes for both - use mock function
 * check search filter - case insensitive
 * check search filter - find nothing
 *
 * check pagination for nodes fetcher
 * check pagination for myself fetcher
 *
 * check ordering for nodes fetcher
 * check ordering for myself fetcher
 *
 * some bps or calculators are in backup status
 * some bps or calculators are in suspended status
 */

describe('Blockchain nodes get - graphql', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(options); });
  afterAll(async () => { await SeedsHelper.doAfterAll(options); });
  beforeEach(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  describe('Positive', () => {
    it('Test trending - only test for graphql client error', async () => {
      await BlockchainCacheService.updateBlockchainNodesByBlockchain();

      const orderBy = '-bp_status';
      const page = 1;
      const perPage = 10;

      const commonParams = {
        page,
        order_by: orderBy,
        per_page: perPage,
      };

      const partsWithAliases = {
        myself_calculators: GraphQLSchema.getManyBlockchainNodesQueryPart({
          ...commonParams,
          filters: {
            myself_votes_only: true,
            user_id: userVlad.id,
            blockchain_nodes_type: Dictionary.BlockchainNodes.typeCalculator(),
          },
        }),
        block_producers: GraphQLSchema.getManyBlockchainNodesQueryPart({
          ...commonParams,
          filters: {
            myself_votes_only: false,
            blockchain_nodes_type: Dictionary.BlockchainNodes.typeBlockProducer(),
          },
        }),
        myself_block_producers: GraphQLSchema.getManyBlockchainNodesQueryPart({
          ...commonParams,
          filters: {
            myself_votes_only: true,
            user_id: userVlad.id,
            blockchain_nodes_type: Dictionary.BlockchainNodes.typeBlockProducer(),
          },
        }),
        calculators: GraphQLSchema.getManyBlockchainNodesQueryPart({
          ...commonParams,
          filters: {
            myself_votes_only: false,
            blockchain_nodes_type: Dictionary.BlockchainNodes.typeCalculator(),
          },
        }),
      };

      const response = await GraphqlRequestHelper.makeRequestFromQueryPartsWithAliasesAsMyself(userVlad, partsWithAliases);

      ResponseHelper.checkEmptyResponseList(response.myself_block_producers);
      ResponseHelper.checkEmptyResponseList(response.myself_calculators);
      ResponseHelper.checkListResponseStructure(response.block_producers);
      ResponseHelper.checkListResponseStructure(response.calculators);

      BlockchainNodesChecker.checkManyBlockchainNodesInterface(response.block_producers.data);
      BlockchainNodesChecker.checkManyBlockchainNodesInterface(response.calculators.data);
    }, JEST_TIMEOUT);
  });
});

export {};
