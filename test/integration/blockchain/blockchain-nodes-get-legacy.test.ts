import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import BlockchainHelper = require('../helpers/blockchain-helper');
import SeedsHelper = require('../helpers/seeds-helper');
import EosApi = require('../../../lib/eos/eosApi');

const { BlockchainNodes, Dictionary } = require('ucom-libs-wallet');
const _ = require('lodash');

let userVlad: UserModel;

EosApi.initWalletApi();

const initialMockFunction = BlockchainNodes.getAll;

const accountName = BlockchainHelper.getTesterAccountName();
const privateKey  = BlockchainHelper.getTesterPrivateKey();

const JEST_TIMEOUT = 5000;

const blockchainNodesType = Dictionary.BlockchainNodes.typeBlockProducer();

describe('Blockchain nodes get - legacy', () => {
  beforeAll(async () => {
    [userVlad] = await SeedsHelper.beforeAllRoutine();
  });

  beforeEach(async () => {
    await SeedsHelper.initUsersOnly();

    BlockchainNodes.getAll = initialMockFunction;
    await BlockchainHelper.updateBlockchainNodes();
  });

  afterEach(() => {
    BlockchainNodes.getAll = initialMockFunction;
  });

  afterAll(async () => { await SeedsHelper.doAfterAll(); });

  describe('Sorting smoke tests', () => {
    it('order by different fields', async () => {
      const fieldsToSort = [
        'id', '-title', 'votes_count', '-votes_amount', 'bp_status',
      ];

      const queryString = `?sort_by=${fieldsToSort.join(',')}`;
      const data = await BlockchainHelper.requestToGetNodesList(null, false, 200, queryString);

      BlockchainHelper.checkManyNodes(data, false, blockchainNodesType);
    });
  });

  describe('Positive', () => {
    it('Get nodes list without filters for guest', async () => {
      const data = await BlockchainHelper.requestToGetNodesList();

      BlockchainHelper.checkManyNodes(data, false, blockchainNodesType);
    });

    it('should contain myself data for user who did not vote yet', async () => {
      await BlockchainHelper.resetVotingState(accountName, privateKey);
      await BlockchainHelper.updateBlockchainNodes();

      const data = await BlockchainHelper.requestToGetNodesList(userVlad);
      BlockchainHelper.checkManyNodes(data, true, blockchainNodesType);

      data.forEach((model) => {
        expect(model.myselfData).toBeDefined();
        expect(model.myselfData.bp_vote).toBeFalsy();
      });
    }, JEST_TIMEOUT * 2);

    it('Get nodes list without filters for myself', async () => {
      const { blockProducersWithVoters } = await BlockchainNodes.getAll();
      const nodesListFromBlockchain = Object.keys(blockProducersWithVoters.indexedNodes);

      const nodes = [
        nodesListFromBlockchain[1],
        nodesListFromBlockchain[4],
        nodesListFromBlockchain[3],
      ];

      const replaceFor = {
        [accountName]: {
          nodes,
          owner: accountName,
        },
      };

      await BlockchainHelper.mockGetBlockchainNodesWalletMethod(_.cloneDeep(replaceFor), false);
      await BlockchainHelper.updateBlockchainNodes();

      const nodesList = await BlockchainHelper.requestToGetNodesList(userVlad);
      BlockchainHelper.checkManyNodes(nodesList, true, blockchainNodesType);

      nodesList.forEach((node) => {
        if (~nodes.indexOf(node.title)) {
          expect(node.myselfData.bp_vote).toBeTruthy();
        } else {
          expect(node.myselfData.bp_vote).toBeFalsy();
        }
      });
    });

    it('Get nodes list with myself_bp_vote=true filter - voted only', async () => {
      const { blockProducersWithVoters } = await BlockchainNodes.getAll();
      const nodesListFromBlockchain = Object.keys(blockProducersWithVoters.indexedNodes);

      const nodeTitlesToVote = [
        nodesListFromBlockchain[1],
        nodesListFromBlockchain[4],
        nodesListFromBlockchain[3],
      ];

      const replaceFor = {
        [accountName]: {
          owner: accountName,
          nodes: nodeTitlesToVote,
        },
      };

      await BlockchainHelper.mockGetBlockchainNodesWalletMethod(_.cloneDeep(replaceFor), false);
      await BlockchainHelper.updateBlockchainNodes();

      const data = await BlockchainHelper.requestToGetNodesList(userVlad, true);
      BlockchainHelper.checkManyNodes(data, true, blockchainNodesType);

      expect(data.length).toBe(nodeTitlesToVote.length);

      nodeTitlesToVote.forEach((title) => {
        expect(data.some(
          item => item.title === title && item.myselfData.bp_vote === true,
        )).toBeTruthy();
      });
    }, JEST_TIMEOUT * 2);

    it('Get nodes which match only search criteria', async () => {
      await BlockchainHelper.mockGetBlockchainNodesWalletMethod({}, false);
      await BlockchainHelper.updateBlockchainNodes();

      const data =
        await BlockchainHelper.requestToGetNodesList(userVlad, false, 200, '?&search=_sUp');

      const expectedTitles = [
        'z_super_new1',
        'z_super_new2',
      ];

      expect(data.length).toBe(expectedTitles.length);

      expectedTitles.forEach((title) => {
        expect(data.some(item => item.title === title)).toBeTruthy();
      });
    });

    it('should find nothing because nothing matches search request', async () => {
      await BlockchainHelper.updateBlockchainNodes();
      const data = await BlockchainHelper.requestToGetNodesList(
        userVlad,
        false,
        200,
        '?&search=not_exists',
        true,
      );

      expect(data.length).toBe(0);
    });
  });

  describe('Negative', () => {
    it('Not possible to ask for myself_bp_vote=true without auth token', async () => {
      await BlockchainHelper.requestToGetNodesList(null, true, 400);
    });
  });
});

export {};
