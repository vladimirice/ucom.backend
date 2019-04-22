import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import BlockchainHelper = require('../helpers/blockchain-helper');
import EosApi = require('../../../lib/eos/eosApi');
import BlockchainService = require('../../../lib/eos/service/blockchain-service');

const { BlockchainNodes, WalletApi } = require('ucom-libs-wallet');

let userPetr: UserModel;
let userRokky: UserModel;

EosApi.initWalletApi();

const _ = require('lodash');

const initialMockFunction = BlockchainNodes.getAll;

const { TransactionSender } = require('ucom-libs-social-transactions');

TransactionSender.initForStagingEnv();

const usersActivityRepository = require('../../../lib/users/repository').Activity;
const blockchainNodesRepository = require('../../../lib/eos/repository').Main;

const JEST_TIMEOUT = 5000;

describe('Blockchain nodes updating', () => {
  beforeAll(async () => {
    // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
    [, , userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();
  });

  beforeEach(async () => {
    await SeedsHelper.initUsersOnly();

    WalletApi.getBlockchainNodes = initialMockFunction;
  });

  afterAll(async () => { await SeedsHelper.doAfterAll(); });

  describe('Some use cases not covered by tests yet', () => {
    it.skip('I voted for node but node is deleted from voters list', async () => {

    });
  });

  describe('Update users activity', () => {
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

      const nodes = await blockchainNodesRepository.findAllBlockchainNodes();

      const petrMustVoteTo = nodes.filter(data => ~addToVote[petrAccountName].nodes.indexOf(data.title));

      expect(petrMustVoteTo.length).toBeGreaterThan(0);

      const rokkyMustVoteTo = nodes.filter(data => ~addToVote[rokkyAccountName].nodes.indexOf(data.title));
      expect(rokkyMustVoteTo.length).toBeGreaterThan(0);

      const res = await usersActivityRepository.findAllUpvoteUsersBlockchainNodesActivity();

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

      const nodes = await blockchainNodesRepository.findAllBlockchainNodes();

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

      const res = await usersActivityRepository.findAllUpvoteUsersBlockchainNodesActivity();

      const resCancel =
        await usersActivityRepository.findAllUpvoteCancelUsersBlockchainNodesActivity();
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

  describe('Update nodes', () => {
    it('should update node records - some nodes are added', async () => {
      await BlockchainHelper.updateBlockchainNodes();

      const { created, updated } =
        await BlockchainHelper.mockGetBlockchainNodesWalletMethod();

      await BlockchainHelper.updateBlockchainNodes();
      const res = await BlockchainHelper.requestToGetNodesList();

      updated.forEach((expected) => {
        const actual = res.find(data => data.title === expected.title);
        expect(actual).toMatchObject(expected);
      });

      created.forEach((expected) => {
        const actual = res.find(data => data.title === expected.title);
        expect(actual).toMatchObject(expected);
      });
    });
  });
});

export {};
