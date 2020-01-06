import { UserModel } from '../../../lib/users/interfaces/model-interfaces';
import { GraphqlRequestHelper } from '../../helpers/common/graphql-request-helper';

import SeedsHelper = require('../helpers/seeds-helper');
import BlockchainCacheService = require('../../../lib/blockchain-nodes/service/blockchain-cache-service');
import EosApi = require('../../../lib/eos/eosApi');
import ResponseHelper = require('../helpers/response-helper');
import BlockchainNodesChecker = require('../../helpers/blockchain/blockchain-nodes-checker');
import BlockchainHelper = require('../helpers/blockchain-helper');
import BlockchainNodesMock = require('../../helpers/blockchain/blockchain-nodes-mock');
import BlockchainNodesRequest = require('../../helpers/blockchain/blockchain-nodes-request');
import BlockchainNodesCommon = require('../../helpers/blockchain/blockchain-nodes-common');

const { Dictionary, BlockchainNodes } = require('ucom-libs-wallet');
const { GraphQLSchema } = require('ucom-libs-graphql-schemas');

let userVlad: UserModel;
let userPetr: UserModel;
let userRokky: UserModel;

const typeBlockProducer: number = Dictionary.BlockchainNodes.typeBlockProducer();
const typeCalculator: number = Dictionary.BlockchainNodes.typeCalculator();

const typeBlockProducerAll = 100; // fake id to simplify development

const JEST_TIMEOUT = 40000;

const initialMockFunction = BlockchainNodes.getAll;

const options = {
  isGraphQl: true,
  workersMocking: 'all',
};

EosApi.initBlockchainLibraries();

describe('Blockchain nodes get - graphql', () => {
  beforeAll(async () => { await SeedsHelper.beforeAllSetting(options); });
  afterAll(async () => { await SeedsHelper.doAfterAll(options); });
  beforeEach(async () => {
    BlockchainNodes.getAll = initialMockFunction;

    [userVlad, , userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  afterEach(async () => {
    BlockchainNodes.getAll = initialMockFunction;
  });

  describe('Positive', () => {
    describe('check statuses', () => {
      it('active and backup status for block producers', async () => {
        await BlockchainCacheService.updateBlockchainNodesByBlockchain();

        const activeBlockProducers = await BlockchainNodes.getActiveBlockProducers();

        const blockProducers  = await BlockchainNodesRequest.requestToBlockchainNodesOnly(userVlad);

        for (const node of blockProducers.data) {
          const fromActive = activeBlockProducers.find(item => item.producer_name === node.title);

          if (fromActive) {
            expect(node.bp_status).toBe(Dictionary.BlockchainNodes.statusActive());
          } else {
            expect(node.bp_status).toBe(Dictionary.BlockchainNodes.statusBackup());
          }
        }
      }, JEST_TIMEOUT * 3);
    });

    describe('searching by title', () => {
      it('Get nodes which match only search criteria', async () => {
        await BlockchainNodesMock.mockGetBlockchainNodesWalletMethod({}, false);
        await BlockchainHelper.updateBlockchainNodes();

        const customParams = {
          filters: {
            title_like: '_sUp',
          },
        };

        const partsWithAliases = {};
        BlockchainNodesRequest.addPartForNodes(partsWithAliases, 'block_producers', typeBlockProducer, customParams);

        const response = await GraphqlRequestHelper.makeRequestFromQueryPartsWithAliasesAsMyself(userVlad, partsWithAliases);

        const expectedTitles = [
          'z_super_new1',
          'z_super_new2',
        ];

        const { data } = response.block_producers;

        expect(data.length).toBe(expectedTitles.length);

        for (const expected of expectedTitles) {
          expect(data.some(item => item.title === expected)).toBeTruthy();
        }
      }, JEST_TIMEOUT);
      it('should find nothing because nothing matches search request', async () => {
        await BlockchainNodesMock.mockGetBlockchainNodesWalletMethod({}, false);
        await BlockchainHelper.updateBlockchainNodes();

        const customParams = {
          filters: {
            title_like: '_nothing000113',
          },
        };

        const partsWithAliases = {};
        BlockchainNodesRequest.addPartForNodes(partsWithAliases, 'block_producers', typeBlockProducer, customParams);

        const response = await GraphqlRequestHelper.makeRequestFromQueryPartsWithAliasesAsMyself(userVlad, partsWithAliases);

        ResponseHelper.checkEmptyResponseList(response.block_producers);
      }, JEST_TIMEOUT);
    });

    describe('Pagination', () => {
      it('Smoke - pagination', async () => {
        await BlockchainCacheService.updateBlockchainNodesByBlockchain();

        const firstPageParams = {
          order_by: '-id',
          page: 1,
          per_page: 2,
        };

        const partsWithAliasesForFirstPage = {};
        BlockchainNodesRequest.addPartForNodes(partsWithAliasesForFirstPage, 'block_producers', typeBlockProducer, firstPageParams);

        const firstPageResponse = await GraphqlRequestHelper.makeRequestFromQueryPartsWithAliasesAsMyself(userVlad, partsWithAliasesForFirstPage);

        const { data:firstPageData } = firstPageResponse.block_producers;
        const { metadata:firstPageMetadata } = firstPageResponse.block_producers;

        expect(firstPageData.length).toBe(firstPageParams.per_page);
        expect(firstPageMetadata.has_more).toBeTruthy();

        const secondPageParams = {
          order_by: '-id',
          page: 2,
          per_page: 2,
        };

        const partsWithAliasesForSecondPage = {};
        BlockchainNodesRequest.addPartForNodes(partsWithAliasesForSecondPage, 'block_producers', typeBlockProducer, secondPageParams);

        const secondPageResponse = await GraphqlRequestHelper.makeRequestFromQueryPartsWithAliasesAsMyself(userVlad, partsWithAliasesForSecondPage);

        const { data:secondPageData } = secondPageResponse.block_producers;
        const { metadata:secondPageMetadata } = secondPageResponse.block_producers;

        expect(secondPageData.length).toBe(firstPageParams.per_page);
        expect(secondPageMetadata.has_more).toBeTruthy();

        for (const firstPageItem of firstPageData) {
          expect(secondPageData.some(item => item.id === firstPageItem.id)).toBeFalsy();
        }
      }, JEST_TIMEOUT * 2);
    });


    it('Smoke - check ordering', async () => {
      const petrAccountName   = BlockchainHelper.getAccountNameByUserAlias('petr');
      const rokkyAccountName  = BlockchainHelper.getAccountNameByUserAlias('rokky');

      await BlockchainNodesMock.mockBlockchainNodesProvider(
        petrAccountName,
        rokkyAccountName,
        typeBlockProducerAll,
      );

      await BlockchainCacheService.updateBlockchainNodesByBlockchain();

      const fieldsToSort = [
        'id', '-title', 'votes_count', '-votes_amount', 'bp_status',
      ];

      const customParams = {
        order_by: fieldsToSort.join(','),
      };

      const partsWithAliases = {};
      BlockchainNodesRequest.addPartForNodes(partsWithAliases, 'block_producers', typeBlockProducer, customParams);
      BlockchainNodesRequest.addPartForNodes(partsWithAliases, 'calculators', typeCalculator, customParams);

      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userPetr, typeBlockProducer, customParams);
      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userRokky, typeBlockProducer, customParams);

      const response = await GraphqlRequestHelper.makeRequestFromQueryPartsWithAliasesAsMyself(userVlad, partsWithAliases);

      BlockchainNodesChecker.checkManyBlockchainNodesInterface(response.block_producers.data);
      BlockchainNodesChecker.checkManyBlockchainNodesInterface(response.calculators.data);

      BlockchainNodesChecker.checkManyBlockchainNodesInterface(
        response[BlockchainNodesCommon.getGraphQlNodeAlias(userPetr, typeBlockProducer)].data,
      );
      BlockchainNodesChecker.checkManyBlockchainNodesInterface(
        response[BlockchainNodesCommon.getGraphQlNodeAlias(userRokky, typeBlockProducer)].data,
      );
    }, JEST_TIMEOUT * 2);

    it('should be the correct interface', async () => {
      await BlockchainHelper.voteForNobody(
        BlockchainHelper.getTesterAccountName(),
        BlockchainHelper.getTesterPrivateKey(),
      );

      await BlockchainCacheService.updateBlockchainNodesByBlockchain();

      const commonParams = BlockchainNodesRequest.getCommonParams();

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
    }, JEST_TIMEOUT * 2);

    it('Vote for block producers via mock and receive result', async () => {
      const petrAccountName   = BlockchainHelper.getAccountNameByUserAlias('petr');
      const rokkyAccountName  = BlockchainHelper.getAccountNameByUserAlias('rokky');

      const mockingResponse = await BlockchainNodesMock.mockBlockchainNodesProvider(
        petrAccountName,
        rokkyAccountName,
        typeBlockProducer,
      );

      const partsWithAliases = {};
      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userPetr, typeBlockProducer);
      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userRokky, typeBlockProducer);

      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userPetr, typeCalculator);
      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userRokky, typeCalculator);

      const response = await GraphqlRequestHelper.makeRequestFromQueryPartsWithAliasesAsMyself(userVlad, partsWithAliases);

      BlockchainNodesChecker.checkVotesForOneUser(response, userPetr, mockingResponse, typeBlockProducer);
      BlockchainNodesChecker.checkVotesForOneUser(response, userRokky, mockingResponse, typeBlockProducer);

      BlockchainNodesChecker.checkThatVotesAreEmptyForOneUser(response, userPetr, typeCalculator);
      BlockchainNodesChecker.checkThatVotesAreEmptyForOneUser(response, userRokky, typeCalculator);
    }, JEST_TIMEOUT * 2);

    it('Vote for calculators via mock and receive result', async () => {
      const petrAccountName   = BlockchainHelper.getAccountNameByUserAlias('petr');
      const rokkyAccountName  = BlockchainHelper.getAccountNameByUserAlias('rokky');

      const mockingResponse = await BlockchainNodesMock.mockBlockchainNodesProvider(
        petrAccountName,
        rokkyAccountName,
        typeCalculator,
      );

      const partsWithAliases = {};
      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userPetr, typeBlockProducer);
      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userRokky, typeBlockProducer);

      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userPetr, typeCalculator);
      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userRokky, typeCalculator);

      const response = await GraphqlRequestHelper.makeRequestFromQueryPartsWithAliasesAsMyself(userVlad, partsWithAliases);

      BlockchainNodesChecker.checkVotesForOneUser(response, userPetr, mockingResponse, typeCalculator);
      BlockchainNodesChecker.checkVotesForOneUser(response, userRokky, mockingResponse, typeCalculator);

      BlockchainNodesChecker.checkThatVotesAreEmptyForOneUser(response, userPetr, typeBlockProducer);
      BlockchainNodesChecker.checkThatVotesAreEmptyForOneUser(response, userRokky, typeBlockProducer);
    }, JEST_TIMEOUT * 2);

    it.skip('Vote for both block producers and calculators via mock and receive result', async () => {
      const petrAccountName   = BlockchainHelper.getAccountNameByUserAlias('petr');
      const rokkyAccountName  = BlockchainHelper.getAccountNameByUserAlias('rokky');

      const mockingResponse = await BlockchainNodesMock.mockBlockchainNodesProvider(
        petrAccountName,
        rokkyAccountName,
        typeBlockProducerAll,
      );

      const partsWithAliases = {};
      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userPetr, typeBlockProducer);
      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userRokky, typeBlockProducer);

      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userPetr, typeCalculator);
      BlockchainNodesRequest.addPartForUserVotes(partsWithAliases, userRokky, typeCalculator);

      const response = await GraphqlRequestHelper.makeRequestFromQueryPartsWithAliasesAsMyself(userVlad, partsWithAliases);

      BlockchainNodesChecker.checkVotesForOneUser(response, userPetr, mockingResponse, typeBlockProducer);
      BlockchainNodesChecker.checkVotesForOneUser(response, userRokky, mockingResponse, typeBlockProducer);

      BlockchainNodesChecker.checkVotesForOneUser(response, userPetr, mockingResponse, typeCalculator);
      BlockchainNodesChecker.checkVotesForOneUser(response, userRokky, mockingResponse, typeCalculator);

      // Then cancel all votes
      BlockchainNodes.getAll = initialMockFunction;
      await BlockchainCacheService.updateBlockchainNodesByBlockchain();

      const responseWithEmptyVotes = await GraphqlRequestHelper.makeRequestFromQueryPartsWithAliasesAsMyself(userVlad, partsWithAliases);

      BlockchainNodesChecker.checkThatVotesAreEmptyForOneUser(responseWithEmptyVotes, userPetr, typeBlockProducer);
      BlockchainNodesChecker.checkThatVotesAreEmptyForOneUser(responseWithEmptyVotes, userPetr, typeCalculator);

      BlockchainNodesChecker.checkThatVotesAreEmptyForOneUser(responseWithEmptyVotes, userRokky, typeBlockProducer);
      BlockchainNodesChecker.checkThatVotesAreEmptyForOneUser(responseWithEmptyVotes, userRokky, typeCalculator);

      // Then again assign them
      await BlockchainNodesMock.mockBlockchainNodesProvider(
        petrAccountName,
        rokkyAccountName,
        typeBlockProducerAll,
      );

      const responseAfterCancel = await GraphqlRequestHelper.makeRequestFromQueryPartsWithAliasesAsMyself(userVlad, partsWithAliases);

      BlockchainNodesChecker.checkVotesForOneUser(responseAfterCancel, userPetr, mockingResponse, typeBlockProducer);
      BlockchainNodesChecker.checkVotesForOneUser(responseAfterCancel, userRokky, mockingResponse, typeBlockProducer);

      BlockchainNodesChecker.checkVotesForOneUser(responseAfterCancel, userPetr, mockingResponse, typeCalculator);
      BlockchainNodesChecker.checkVotesForOneUser(responseAfterCancel, userRokky, mockingResponse, typeCalculator);
    }, JEST_TIMEOUT);
  });
});

export {};
