const helpers = require('../helpers');

const { WalletApi } = require('uos-app-wallet');

let userVlad, userJane, userPetr, userRokky;
WalletApi.initForStagingEnv();
WalletApi.setNodeJsEnv();

const initialMockFunction = WalletApi.getBlockchainNodes;

const { TransactionSender } = require('uos-app-transaction');

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
  });

  afterEach(() => {
    WalletApi.getBlockchainNodes = initialMockFunction;
  });

  describe('Update users activity', () => {
    it('should create basic users activity of bp votes', async () => {
      const addToVote = [
        {
          owner: 'petr',
          producers: [
            'calc2',
            'calc5',
            'calc4',
            'z_super_new2'
          ],
        },
        {
          owner: 'rokky',
          producers: [
            'calc3',
            'calc4',
            'z_super_new1',
            'calc5',
          ],
        }
      ];

      await helpers.Blockchain.mockGetBlockchainNodesWalletMethod(addToVote);
      await helpers.Blockchain.updateBlockchainNodes();
      const nodes = await BlockchainNodesRepository.findAllBlockchainNodes();

      const petrMustVoteTo = nodes.filter(data => {
        return ~addToVote[0].producers.indexOf(data.title);
      });

      const rokkyMustVoteTo = nodes.filter(data => {
        return ~addToVote[1].producers.indexOf(data.title);
      });

      const res = await UsersActivityRepository.findAllUpvoteUsersBlockchainNodesActivity();

      const petrActivity = res.filter(data => {
        return data.user_id_from === userPetr.id
      });

      const rokkyActivity = res.filter(data => {
        return data.user_id_from === userRokky.id
      });

      expect(petrActivity.length).toBe(petrMustVoteTo.length);
      expect(rokkyActivity.length).toBe(rokkyMustVoteTo.length);

      petrMustVoteTo.forEach(data => {
        expect(petrActivity.some(activity => +activity.entity_id_to === data.id)).toBeTruthy();
      });

      rokkyMustVoteTo.forEach(data => {
        expect(rokkyActivity.some(activity => +activity.entity_id_to === data.id)).toBeTruthy();
      });
    }, 10000);

    it('should update users activity if somebody votes', async () => {
      const addToVote = [
        {
          owner: 'petr',
          producers: [
            'calc2',
            'calc5',
            'calc4',
            'z_super_new2'
          ],
        },
        {
          owner: 'rokky',
          producers: [
            'calc3',
            'calc4',
            'z_super_new1',
            'calc5',
          ],
        }
      ];

      const initialFunction = WalletApi.getBlockchainNodes;

      await helpers.Blockchain.mockGetBlockchainNodesWalletMethod(addToVote);
      await helpers.Blockchain.updateBlockchainNodes();
      const nodes = await BlockchainNodesRepository.findAllBlockchainNodes();

      // restore mocked function
      WalletApi.getBlockchainNodes = initialFunction;

      // lets update userPetr state
      const addToVoteAfter = [
        {
          owner: 'petr',
          producers: [
            // add these ones
            'z_super_new1',
            'calc3',

            // remove these nodes from voting
            // 'calc2',
            // 'calc5',

            // remain these ones
            'calc4',
            'z_super_new2'
          ],
        },
        {
          owner: 'rokky',
          producers: [
            // add these ones
            'calc2',
            'z_super_new2',

            // remove
            // 'z_super_new1',
            // 'calc5',

            // remain
            'calc3',
            'calc4',
          ],
        }
      ];

      await helpers.Blockchain.mockGetBlockchainNodesWalletMethod(addToVoteAfter);
      await helpers.Blockchain.updateBlockchainNodes();

      const petrMustVoteTo = nodes.filter(data => {
        return ~addToVoteAfter[0].producers.indexOf(data.title);
      });
      const petrMustNotContain = nodes.filter(data => {
        return ~['calc2', 'calc5'].indexOf(data.title);
      });

      const rokkyMustVoteTo = nodes.filter(data => {
        return ~addToVoteAfter[1].producers.indexOf(data.title);
      });
      const rokkyMustNotContain = nodes.filter(data => {
        return ~['z_super_new1', 'calc5'].indexOf(data.title);
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

      const res = await helpers.Blockchain.getAllBlockchainNodes();
      expect(res.length).toBe(5); // hardcoded constant
    });

    it('should update node records - some nodes are added and some are removed', async () => {
      // initial state
      await helpers.Blockchain.updateBlockchainNodes();

      const {created, updated, deleted} = await helpers.Blockchain.mockGetBlockchainNodesWalletMethod();

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
    });
  });
});
