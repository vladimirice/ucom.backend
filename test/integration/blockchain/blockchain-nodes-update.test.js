const helpers = require('../helpers');

const { WalletApi } = require('ucom-libs-wallet');

let userVlad, userJane, userPetr, userRokky;
WalletApi.initForStagingEnv();
WalletApi.setNodeJsEnv();

const _ = require('lodash');
const initialMockFunction = WalletApi.getBlockchainNodes;

const { TransactionSender } = require('ucom-libs-social-transactions');

TransactionSender.initForStagingEnv();

const UsersActivityRepository = require('../../../lib/users/repository').Activity;
const BlockchainNodesRepository = require('../../../lib/eos/repository').Main;

describe('Blockchain nodes updating', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  beforeEach(async () => {
    await helpers.Seeds.destroyTables();
    await helpers.Seeds.initUsersOnly();

    WalletApi.getBlockchainNodes = initialMockFunction;
  });

  afterAll(async () => { await helpers.Seeds.doAfterAll(); });

  describe('Some use cases not covered by tests yet', () => {
    it.skip('should properly process situation - I voted for node but node is deleted from voters list', async () => {

    });
  });

  describe('Update users activity', () => {
    it('should create basic users activity of bp votes', async () => {
      const petrAccountName   = helpers.Blockchain.getAccountNameByUserAlias('petr');
      const rokkyAccountName  = helpers.Blockchain.getAccountNameByUserAlias('rokky');
      const producers = helpers.Blockchain.getBlockProducersList();

      const addToVote = {
        [petrAccountName]: {
          owner: petrAccountName,
          producers: [
            producers[0],
            producers[2],
            producers[3],
            'z_super_new2'
          ],
        },
        [rokkyAccountName]: {
          owner: rokkyAccountName,
          producers: [
            producers[1],
            producers[3],
            'z_super_new1',
            producers[4],
          ],
        }
      };

      await helpers.Blockchain.mockGetBlockchainNodesWalletMethod(_.cloneDeep(addToVote), false);
      await helpers.Blockchain.updateBlockchainNodes();

      const nodes = await BlockchainNodesRepository.findAllBlockchainNodes();

      const petrMustVoteTo = nodes.filter(data => {
        return ~addToVote[petrAccountName].producers.indexOf(data.title);
      });

      expect(petrMustVoteTo.length).toBeGreaterThan(0);

      const rokkyMustVoteTo = nodes.filter(data => {
        return ~addToVote[rokkyAccountName].producers.indexOf(data.title);
      });
      expect(rokkyMustVoteTo.length).toBeGreaterThan(0);

      const res = await UsersActivityRepository.findAllUpvoteUsersBlockchainNodesActivity();

      const petrActivity = res.filter(data => {
        return data.user_id_from === userPetr.id
      });

      const rokkyActivity = res.filter(data => {
        return data.user_id_from === userRokky.id
      });

      expect(petrActivity.length).toBe(Object.keys(petrMustVoteTo).length);
      expect(rokkyActivity.length).toBe(rokkyMustVoteTo.length);

      petrMustVoteTo.forEach(data => {
        expect(petrActivity.some(activity => +activity.entity_id_to === data.id)).toBeTruthy();
      });

      rokkyMustVoteTo.forEach(data => {
        expect(rokkyActivity.some(activity => +activity.entity_id_to === data.id)).toBeTruthy();
      });
    }, 10000);

    it('should update users activity if somebody votes', async () => {
      const petrAccountName   = helpers.Blockchain.getAccountNameByUserAlias('petr');
      const rokkyAccountName  = helpers.Blockchain.getAccountNameByUserAlias('rokky');
      const producers         = helpers.Blockchain.getBlockProducersList();

      const addToVote = {
        [petrAccountName]: {
          owner: petrAccountName,
          producers: [
            producers[1],
            producers[4],
            producers[3],
            'z_super_new2'
          ],
        },
        [rokkyAccountName]: {
          owner: rokkyAccountName,
          producers: [
            producers[2],
            producers[3],
            'z_super_new1',
            producers[4],
          ],
        }
      };

      await helpers.Blockchain.mockGetBlockchainNodesWalletMethod(_.cloneDeep(addToVote), false);
      await helpers.Blockchain.updateBlockchainNodes();

      const nodes = await BlockchainNodesRepository.findAllBlockchainNodes();

      // restore mocked function
      WalletApi.getBlockchainNodes = initialMockFunction;

      // lets update userPetr state
      const addToVoteAfter = {
        [petrAccountName]: {
          owner: petrAccountName,
          producers: [
            // add these ones
            'z_super_new1',
            producers[2],

            // remove these nodes from voting
            // 'calc2',
            // 'calc5',

            // remain these ones
            producers[3],
            'z_super_new2'
          ],
        },
        [rokkyAccountName]: {
          owner: rokkyAccountName,
          producers: [
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
        }
      };

      await helpers.Blockchain.mockGetBlockchainNodesWalletMethod(_.cloneDeep(addToVoteAfter), false);
      await helpers.Blockchain.updateBlockchainNodes();

      const petrMustVoteTo = nodes.filter(data => {
        return ~addToVoteAfter[petrAccountName].producers.indexOf(data.title);
      });
      const petrMustNotContain = nodes.filter(data => {
        return ~[producers[1], producers[4]].indexOf(data.title);
      });

      const rokkyMustVoteTo = nodes.filter(data => {
        return ~addToVoteAfter[rokkyAccountName].producers.indexOf(data.title);
      });
      const rokkyMustNotContain = nodes.filter(data => {
        return ~['z_super_new1', producers[4]].indexOf(data.title);
      });

      const res = await UsersActivityRepository.findAllUpvoteUsersBlockchainNodesActivity();

      const resCancel = await UsersActivityRepository.findAllUpvoteCancelUsersBlockchainNodesActivity();
      petrMustNotContain.forEach(node => {
        expect(resCancel.some(data => +data.entity_id_to === node.id && data.user_id_from === userPetr.id)).toBeTruthy();
      });
      rokkyMustNotContain.forEach(node => {
        expect(resCancel.some(data => +data.entity_id_to === node.id && data.user_id_from === userRokky.id)).toBeTruthy();
      });

      const petrActivity = res.filter(data => {
        return data.user_id_from === userPetr.id
      });

      const rokkyActivity = res.filter(data => {
        return data.user_id_from === userRokky.id
      });

      expect(petrActivity.length).toBe(petrMustVoteTo.length);
      expect(rokkyActivity.length).toBe(rokkyMustVoteTo.length);

      petrMustNotContain.forEach(node => {
        expect(petrActivity.some(data => +data.entity_id_to === node.id)).toBeFalsy();
      });
      rokkyMustNotContain.forEach(node => {
        expect(rokkyActivity.some(data => +data.entity_id_to === node.id)).toBeFalsy();
      });

      petrMustVoteTo.forEach(node => {
        expect(petrActivity.some(data => +data.entity_id_to === node.id)).toBeTruthy();
      });
      rokkyMustVoteTo.forEach(node => {
        expect(rokkyActivity.some(data => +data.entity_id_to === node.id)).toBeTruthy();
      });
    });
  });

  describe('Update nodes', function () {
    it('should create new node records for empty database', async () => {
      await helpers.Blockchain.updateBlockchainNodes();

      await helpers.Blockchain.requestToGetNodesList();
    });

    it('should update node records - some nodes are added and some are removed', async () => {
      await helpers.Blockchain.updateBlockchainNodes();

      const {created, updated, deleted} = await helpers.Blockchain.mockGetBlockchainNodesWalletMethod();
      expect(deleted.length).toBeGreaterThan(0);

      // new state
      await helpers.Blockchain.updateBlockchainNodes();
      const res = await helpers.Blockchain.requestToGetNodesList();

      updated.forEach(expected => {
        const actual = res.find(data => data.title === expected.title);
        expect(actual).toMatchObject(expected);
      });

      created.forEach(expected => {
        const actual = res.find(data => data.title === expected.title);
        expect(actual).toMatchObject(expected);
      });

      deleted.forEach(noExpectedTitle => {
        expect(res.some(data => data.title === noExpectedTitle)).toBeFalsy();
      });

      // restore removed node
      WalletApi.getBlockchainNodes = initialMockFunction;
      await helpers.Blockchain.updateBlockchainNodes();

      const resAfterRestore = await helpers.Blockchain.requestToGetNodesList();
      deleted.forEach(noExpectedTitle => {
        expect(resAfterRestore.some(data => data.title === noExpectedTitle)).toBeTruthy();
      });
    });
  });
});
