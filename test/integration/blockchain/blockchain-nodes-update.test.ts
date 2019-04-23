/* eslint-disable sonarjs/cognitive-complexity */
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import BlockchainHelper = require('../helpers/blockchain-helper');
import EosApi = require('../../../lib/eos/eosApi');
import BlockchainService = require('../../../lib/eos/service/blockchain-service');
import UsersActivityRepository = require('../../../lib/users/repository/users-activity-repository');
import BlockchainNodesRepository = require('../../../lib/eos/repository/blockchain-nodes-repository');
import ResponseHelper = require('../helpers/response-helper');

const { BlockchainNodes, WalletApi, Dictionary } = require('ucom-libs-wallet');

let userPetr: UserModel;
let userRokky: UserModel;

EosApi.initWalletApi();

const _ = require('lodash');

const initialMockFunction = BlockchainNodes.getAll;
const JEST_TIMEOUT = 5000;

describe('Blockchain nodes updating', () => {
  const blockchainNodesType: number = Dictionary.BlockchainNodes.typeBlockProducer();

  beforeAll(async () => {
    // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
    [, , userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  beforeEach(async () => {
    await SeedsHelper.initUsersOnly();

    WalletApi.getBlockchainNodes = initialMockFunction;
  });

  afterAll(async () => { await SeedsHelper.doAfterAll(); });

  describe('blockchain nodes list', () => {
    it('should cache all blockchain nodes list', async () => {
      await BlockchainService.updateBlockchainNodesByBlockchain();

      const { blockProducersWithVoters, calculatorsWithVoters } = await BlockchainNodes.getAll();

      const actualNodes = await BlockchainNodesRepository.findAllBlockchainNodes();

      const total = Object.keys(blockProducersWithVoters.indexedNodes).length +
        Object.keys(calculatorsWithVoters.indexedNodes).length;

      expect(actualNodes.length).toBe(total);

      for (const title in blockProducersWithVoters.indexedNodes) {
        if (!blockProducersWithVoters.indexedNodes.hasOwnProperty(title)) {
          continue;
        }

        const expected = _.cloneDeep(blockProducersWithVoters.indexedNodes[title]);

        const actual = actualNodes.find(item => item.title === expected.title);

        delete actual.id;
        expect(actual.blockchain_nodes_type).toBe(Dictionary.BlockchainNodes.typeBlockProducer());

        delete actual.blockchain_nodes_type;

        expect(actual).toEqual(expected);
      }

      for (const title in calculatorsWithVoters.indexedNodes) {
        if (!calculatorsWithVoters.indexedNodes.hasOwnProperty(title)) {
          continue;
        }

        const expected = _.cloneDeep(calculatorsWithVoters.indexedNodes[title]);

        const actual = actualNodes.find(item => item.title === expected.title);

        delete actual.id;
        expect(actual.blockchain_nodes_type).toBe(Dictionary.BlockchainNodes.typeCalculator());

        delete actual.blockchain_nodes_type;

        expect(actual).toEqual(expected);
      }
    }, JEST_TIMEOUT);

    it('should update node records - some nodes are added', async () => {
      await BlockchainHelper.updateBlockchainNodes();

      const { created, updated, createdCalculators } =
        await BlockchainHelper.mockGetBlockchainNodesWalletMethod();

      await BlockchainHelper.updateBlockchainNodes();
      const response = await BlockchainNodesRepository.findAllBlockchainNodes();

      for (const expected of updated) {
        const actual = response.find(data => data.title === expected.title);
        ResponseHelper.expectNotEmpty(actual);

        expect(actual).toMatchObject(expected);
      }

      for (const expected of created) {
        const actual = response.find(data => data.title === expected.title);
        ResponseHelper.expectNotEmpty(actual);

        expect(actual).toMatchObject(expected);
      }

      for (const expected of createdCalculators) {
        const actual = response.find(data => data.title === expected.title);
        ResponseHelper.expectNotEmpty(actual);
        expect(actual).toMatchObject(expected);
      }
    }, JEST_TIMEOUT);
  });

  describe('Block producers processing', () => {
    it('should create basic users activity of bp votes', async () => {
      const petrAccountName   = BlockchainHelper.getAccountNameByUserAlias('petr');
      const rokkyAccountName  = BlockchainHelper.getAccountNameByUserAlias('rokky');

      const { blockProducersWithVoters } = await BlockchainNodes.getAll();

      const producers = Object.keys(blockProducersWithVoters.indexedNodes);

      const addToVote = {
        [petrAccountName]: {
          owner: petrAccountName,
          nodes: [
            producers[0],
            producers[2],
            producers[3],
            'z_super_new2',
          ],
        },
        [rokkyAccountName]: {
          owner: rokkyAccountName,
          nodes: [
            producers[1],
            producers[3],
            'z_super_new1',
            producers[4],
          ],
        },
      };

      await BlockchainHelper.mockGetBlockchainNodesWalletMethod(_.cloneDeep(addToVote), false);
      await BlockchainService.updateBlockchainNodesByBlockchain();

      const nodes = await BlockchainNodesRepository.findAllBlockchainNodes();

      const petrMustVoteTo = nodes.filter(data => ~addToVote[petrAccountName].nodes.indexOf(data.title));

      expect(petrMustVoteTo.length).toBeGreaterThan(0);

      const rokkyMustVoteTo = nodes.filter(data => ~addToVote[rokkyAccountName].nodes.indexOf(data.title));
      expect(rokkyMustVoteTo.length).toBeGreaterThan(0);

      const res = await UsersActivityRepository.findAllUpvoteUsersBlockchainNodesActivity(
        blockchainNodesType,
      );

      const petrActivity = res.filter(data => data.user_id_from === userPetr.id);

      const rokkyActivity = res.filter(data => data.user_id_from === userRokky.id);

      expect(petrActivity.length).toBe(Object.keys(petrMustVoteTo).length);
      expect(rokkyActivity.length).toBe(rokkyMustVoteTo.length);

      petrMustVoteTo.forEach((data) => {
        expect(petrActivity.some(activity => +activity.entity_id_to === data.id)).toBeTruthy();
      });

      rokkyMustVoteTo.forEach((data) => {
        expect(rokkyActivity.some(activity => +activity.entity_id_to === data.id)).toBeTruthy();
      });
    }, JEST_TIMEOUT * 20);

    it('should update users activity if somebody votes', async () => {
      const petrAccountName   = BlockchainHelper.getAccountNameByUserAlias('petr');
      const rokkyAccountName  = BlockchainHelper.getAccountNameByUserAlias('rokky');

      const { blockProducersWithVoters } = await BlockchainNodes.getAll();
      const producers = Object.keys(blockProducersWithVoters.indexedNodes);

      const addToVote = {
        [petrAccountName]: {
          owner: petrAccountName,
          nodes: [
            producers[1],
            producers[4],
            producers[3],
            'z_super_new2',
          ],
        },
        [rokkyAccountName]: {
          owner: rokkyAccountName,
          nodes: [
            producers[2],
            producers[3],
            'z_super_new1',
            producers[4],
          ],
        },
      };

      await BlockchainHelper.mockGetBlockchainNodesWalletMethod(_.cloneDeep(addToVote), false);
      await BlockchainHelper.updateBlockchainNodes();

      const nodes = await BlockchainNodesRepository.findAllBlockchainNodes();

      // restore mocked function
      WalletApi.getBlockchainNodes = initialMockFunction;

      // lets update userPetr state
      const addToVoteAfter = {
        [petrAccountName]: {
          owner: petrAccountName,
          nodes: [
            // add these ones
            'z_super_new1',
            producers[2],

            // remove these nodes from voting
            // 'calc2',
            // 'calc5',

            // remain these ones
            producers[3],
            'z_super_new2',
          ],
        },
        [rokkyAccountName]: {
          owner: rokkyAccountName,
          nodes: [
            // add these ones
            producers[1],
            'z_super_new2',

            // remove
            // 'z_super_new1',
            // 'calc5',

            // remain
            producers[2],
            producers[3],
          ],
        },
      };

      await BlockchainHelper.mockGetBlockchainNodesWalletMethod(
        _.cloneDeep(addToVoteAfter),
        false,
      );
      await BlockchainHelper.updateBlockchainNodes();

      const petrMustVoteTo = nodes.filter(data => ~addToVoteAfter[petrAccountName].nodes.indexOf(data.title));
      const petrMustNotContain = nodes.filter(data => ~[producers[1], producers[4]].indexOf(data.title));

      const rokkyMustVoteTo = nodes.filter(data => ~addToVoteAfter[rokkyAccountName].nodes.indexOf(data.title));
      const rokkyMustNotContain = nodes.filter(data => ~['z_super_new1', producers[4]].indexOf(data.title));

      const res = await UsersActivityRepository.findAllUpvoteUsersBlockchainNodesActivity(
        blockchainNodesType,
      );

      const resCancel =
        await UsersActivityRepository.findAllUpvoteCancelUsersBlockchainNodesActivity(blockchainNodesType);
      petrMustNotContain.forEach((node) => {
        expect(resCancel.some(
          data => +data.entity_id_to === node.id && data.user_id_from === userPetr.id,
        )).toBeTruthy();
      });
      rokkyMustNotContain.forEach((node) => {
        expect(resCancel.some(
          data => +data.entity_id_to === node.id && data.user_id_from === userRokky.id,
        )).toBeTruthy();
      });

      const petrActivity = res.filter(data => data.user_id_from === userPetr.id);

      const rokkyActivity = res.filter(data => data.user_id_from === userRokky.id);

      expect(petrActivity.length).toBe(petrMustVoteTo.length);
      expect(rokkyActivity.length).toBe(rokkyMustVoteTo.length);

      petrMustNotContain.forEach((node) => {
        expect(petrActivity.some(data => +data.entity_id_to === node.id)).toBeFalsy();
      });
      rokkyMustNotContain.forEach((node) => {
        expect(rokkyActivity.some(data => +data.entity_id_to === node.id)).toBeFalsy();
      });

      petrMustVoteTo.forEach((node) => {
        expect(petrActivity.some(data => +data.entity_id_to === node.id)).toBeTruthy();
      });
      rokkyMustVoteTo.forEach((node) => {
        expect(rokkyActivity.some(data => +data.entity_id_to === node.id)).toBeTruthy();
      });
    }, JEST_TIMEOUT * 2);
  });
});

export {};
