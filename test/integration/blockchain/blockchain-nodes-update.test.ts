/* eslint-disable sonarjs/cognitive-complexity */
import { UserModel } from '../../../lib/users/interfaces/model-interfaces';

import SeedsHelper = require('../helpers/seeds-helper');
import BlockchainHelper = require('../helpers/blockchain-helper');
import EosApi = require('../../../lib/eos/eosApi');
import UsersActivityRepository = require('../../../lib/users/repository/users-activity-repository');
import BlockchainNodesRepository = require('../../../lib/blockchain-nodes/repository/blockchain-nodes-repository');
import ResponseHelper = require('../helpers/response-helper');
import BlockchainNodesMock = require('../../helpers/blockchain/blockchain-nodes-mock');
import BlockchainCacheService = require('../../../lib/blockchain-nodes/service/blockchain-cache-service');

const { BlockchainNodes, Dictionary } = require('ucom-libs-wallet');

let userPetr: UserModel;
let userRokky: UserModel;

EosApi.initBlockchainLibraries();

const typeBlockProducer: number = Dictionary.BlockchainNodes.typeBlockProducer();
const typeCalculator: number = Dictionary.BlockchainNodes.typeCalculator();

const _ = require('lodash');

let initialMockFunction;
const JEST_TIMEOUT = 20000;

describe('Blockchain nodes updating', () => {
  beforeAll(async () => {
    initialMockFunction = BlockchainNodes.getAll;
  });

  beforeEach(async () => {
    // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
    [, , userPetr, userRokky] = await SeedsHelper.beforeAllRoutine();

    BlockchainNodes.getAll = initialMockFunction;
  });

  afterAll(async () => { await SeedsHelper.doAfterAll(); });


  describe('blockchain nodes list', () => {
    it('should cache all blockchain nodes list', async () => {
      await BlockchainCacheService.updateBlockchainNodesByBlockchain();

      const { blockProducersWithVoters, calculatorsWithVoters } = await BlockchainNodes.getAll();

      const actualNodes = await BlockchainNodesRepository.findAllBlockchainNodesLegacy();

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
        expect(actual.blockchain_nodes_type).toBe(typeCalculator);

        delete actual.blockchain_nodes_type;

        expect(actual).toEqual(expected);
      }
    }, JEST_TIMEOUT * 100);

    it('should update node records - some nodes are added', async () => {
      await BlockchainHelper.updateBlockchainNodes();

      const { created, updated, createdCalculators } =
        await BlockchainNodesMock.mockGetBlockchainNodesWalletMethod();

      await BlockchainHelper.updateBlockchainNodes();
      const response = await BlockchainNodesRepository.findAllBlockchainNodesLegacy();

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
    }, JEST_TIMEOUT * 10);
  });

  describe('Block producers processing', () => {
    const blockchainNodesType: number = typeBlockProducer;

    it('should create basic users activity of bp votes', async () => {
      const petrAccountName   = BlockchainHelper.getAccountNameByUserAlias('petr');
      const rokkyAccountName  = BlockchainHelper.getAccountNameByUserAlias('rokky');

      const { addToVoteBlockProducers:addToVote } = await BlockchainNodesMock.mockBlockchainNodesProvider(
        petrAccountName,
        rokkyAccountName,
        blockchainNodesType,
      );

      const nodes = await BlockchainNodesRepository.findAllBlockchainNodesLegacy();

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
    }, JEST_TIMEOUT * 2);

    it.skip('should update users activity if somebody votes', async () => {
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

      await BlockchainNodesMock.mockGetBlockchainNodesWalletMethod(_.cloneDeep(addToVote), false);
      await BlockchainHelper.updateBlockchainNodes();

      const nodes = await BlockchainNodesRepository.findAllBlockchainNodesLegacy();

      // restore mocked function
      BlockchainNodes.getAl = initialMockFunction;

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

      await BlockchainNodesMock.mockGetBlockchainNodesWalletMethod(
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
    }, JEST_TIMEOUT * 3);
  });

  describe('Calculators processing', () => {
    const blockchainNodesType: number = typeCalculator;

    it.skip('should create basic users activity of calculators votes', async () => {
      const petrAccountName   = BlockchainHelper.getAccountNameByUserAlias('petr');
      const rokkyAccountName  = BlockchainHelper.getAccountNameByUserAlias('rokky');

      const { calculatorsWithVoters } = await BlockchainNodes.getAll();

      const nodesCalculators = Object.keys(calculatorsWithVoters.indexedNodes);

      const addToVote = {
        [petrAccountName]: {
          owner: petrAccountName,
          nodes: [
            nodesCalculators[0],
            nodesCalculators[2],
            nodesCalculators[3],
            'z_calculator_super_new2',
          ],
        },
        [rokkyAccountName]: {
          owner: rokkyAccountName,
          nodes: [
            nodesCalculators[1],
            nodesCalculators[3],
            'z_calculator_super_new1',
            nodesCalculators[4],
          ],
        },
      };

      await BlockchainNodesMock.mockGetBlockchainNodesWalletMethod({}, false, _.cloneDeep(addToVote));
      await BlockchainCacheService.updateBlockchainNodesByBlockchain();


      const params = {
        where: {
          blockchain_nodes_type: typeCalculator,
        },
      };

      const nodes = await BlockchainNodesRepository.findAllBlockchainNodesLegacy(params);

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
    }, JEST_TIMEOUT * 2);

    it.skip('should update users activity if somebody votes', async () => {
      const petrAccountName   = BlockchainHelper.getAccountNameByUserAlias('petr');
      const rokkyAccountName  = BlockchainHelper.getAccountNameByUserAlias('rokky');

      const { calculatorsWithVoters } = await BlockchainNodes.getAll();
      const nodesCalculators = Object.keys(calculatorsWithVoters.indexedNodes);

      const addToVote = {
        [petrAccountName]: {
          owner: petrAccountName,
          nodes: [
            nodesCalculators[1],
            nodesCalculators[4],
            nodesCalculators[3],
            'z_calculator_super_new2',
          ],
        },
        [rokkyAccountName]: {
          owner: rokkyAccountName,
          nodes: [
            nodesCalculators[2],
            nodesCalculators[3],
            'z_calculator_super_new1',
            nodesCalculators[4],
          ],
        },
      };

      await BlockchainNodesMock.mockGetBlockchainNodesWalletMethod({}, false, _.cloneDeep(addToVote));
      await BlockchainHelper.updateBlockchainNodes();

      const params = {
        where: {
          blockchain_nodes_type: typeCalculator,
        },
      };
      const nodes = await BlockchainNodesRepository.findAllBlockchainNodesLegacy(params);

      // restore mocked function
      BlockchainNodes.getAl = initialMockFunction;

      // lets update userPetr state
      const addToVoteAfter = {
        [petrAccountName]: {
          owner: petrAccountName,
          nodes: [
            // add these ones
            'z_calculator_super_new1',
            nodesCalculators[2],

            // remove these nodes from voting
            // 'calc2',
            // 'calc5',

            // remain these ones
            nodesCalculators[3],
            'z_calculator_super_new2',
          ],
        },
        [rokkyAccountName]: {
          owner: rokkyAccountName,
          nodes: [
            // add these ones
            nodesCalculators[1],
            'z_calculator_super_new2',

            // remove
            // 'z_super_new1',
            // 'calc5',

            // remain
            nodesCalculators[2],
            nodesCalculators[3],
          ],
        },
      };

      await BlockchainNodesMock.mockGetBlockchainNodesWalletMethod(
        {},
        false,
        _.cloneDeep(addToVoteAfter),
      );
      await BlockchainHelper.updateBlockchainNodes();

      const petrMustVoteTo = nodes.filter(data => ~addToVoteAfter[petrAccountName].nodes.indexOf(data.title));
      const petrMustNotContain = nodes.filter(data => ~[nodesCalculators[1], nodesCalculators[4]].indexOf(data.title));

      const rokkyMustVoteTo = nodes.filter(data => ~addToVoteAfter[rokkyAccountName].nodes.indexOf(data.title));
      const rokkyMustNotContain = nodes.filter(data => ~['z_calculator_super_new1', nodesCalculators[4]].indexOf(data.title));

      const res = await UsersActivityRepository.findAllUpvoteUsersBlockchainNodesActivity(
        blockchainNodesType,
      );

      const resCancel =
        await UsersActivityRepository.findAllUpvoteCancelUsersBlockchainNodesActivity(blockchainNodesType);
      // eslint-disable-next-line sonarjs/no-identical-functions
      petrMustNotContain.forEach((node) => {
        expect(resCancel.some(
          data => +data.entity_id_to === node.id && data.user_id_from === userPetr.id,
        )).toBeTruthy();
      });
      // eslint-disable-next-line sonarjs/no-identical-functions
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
