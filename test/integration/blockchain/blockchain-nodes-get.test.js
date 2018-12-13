const helpers = require('../helpers');

const { WalletApi } = require('ucom-libs-wallet');
const _ = require('lodash');

let userVlad, userJane, userPetr, userRokky;
WalletApi.initForStagingEnv();
WalletApi.setNodeJsEnv();

const initialMockFunction = WalletApi.getBlockchainNodes;

const accountName = helpers.Blockchain.getTesterAccountName();
const privateKey  = helpers.Blockchain.getTesterPrivateKey();

describe('Blockchain nodes get', () => {
  beforeAll(async () => {
    [userVlad, userJane, userPetr, userRokky] = await helpers.SeedsHelper.beforeAllRoutine();
  });

  beforeEach(async () => {
    await helpers.Seeds.destroyTables();
    await helpers.Seeds.initUsersOnly();

    WalletApi.getBlockchainNodes = initialMockFunction;
    await helpers.Blockchain.updateBlockchainNodes();
  });

  afterEach(() => {
    WalletApi.getBlockchainNodes = initialMockFunction;
  });

  afterAll(async () => { await helpers.Seeds.doAfterAll(); });

  describe('Sorting smoke tests', () => {
    it('order by different fields', async () => {
      const fieldsToSort = [
        'id', '-title', 'votes_count', '-votes_amount', 'bp_status',
      ];

      const queryString = `?sort_by=${fieldsToSort.join(',')}`;
      const data = await helpers.Blockchain.requestToGetNodesList(null, false, 200, queryString);

      helpers.Blockchain.checkManyProducers(data, false);
    });
  });

  describe('Positive', () => {
    it('Get nodes list without filters for guest', async () => {
      const data = await helpers.Blockchain.requestToGetNodesList();

      helpers.Blockchain.checkManyProducers(data, false);
    });

    it('should contain myself data for user who did not vote yet', async () => {
      await helpers.Blockchain.resetVotingState(accountName, privateKey);
      await helpers.Blockchain.updateBlockchainNodes();

      const data = await helpers.Blockchain.requestToGetNodesList(userVlad);
      helpers.Blockchain.checkManyProducers(data, true);

      data.forEach(model => {
        expect(model.myselfData).toBeDefined();
        expect(model.myselfData.bp_vote).toBeFalsy();
      });
    }, 10000);

    it('Get nodes list without filters for myself', async () => {
      const producers = [
        'calc2',
        'calc5',
        'calc4',
      ];

      const replaceFor = {
        'vlad': {
          owner: 'vlad',
          producers,
        },
      };

      await helpers.Blockchain.mockGetBlockchainNodesWalletMethod(_.cloneDeep(replaceFor), false);
      await helpers.Blockchain.updateBlockchainNodes();

      const nodesList = await helpers.Blockchain.requestToGetNodesList(userVlad);
      helpers.Blockchain.checkManyProducers(nodesList, true);

      nodesList.forEach(node => {
        if (~producers.indexOf(node.title)) {
          expect(node.myselfData.bp_vote).toBeTruthy();
        } else {
          expect(node.myselfData.bp_vote).toBeFalsy();
        }
      });
    });

    it('Get nodes list with myself_bp_vote=true filter - voted only', async () => {
      const nodeTitlesToVote = [
        'calc2',
        'calc5',
        'calc4',
      ];

      const replaceFor = {
        'vlad': {
          owner: 'vlad',
          producers: nodeTitlesToVote,
        },
      };

      await helpers.Blockchain.mockGetBlockchainNodesWalletMethod(_.cloneDeep(replaceFor), false);
      await helpers.Blockchain.updateBlockchainNodes();

      const data = await helpers.Blockchain.requestToGetNodesList(userVlad, true);
      helpers.Blockchain.checkManyProducers(data, true);

      expect(data.length).toBe(nodeTitlesToVote.length);

      nodeTitlesToVote.forEach(title => {
        expect(data.some(producer => producer.title === title && producer.myselfData.bp_vote === true)).toBeTruthy()
      });
    }, 30000);

    it('Get nodes which match only search criteria', async () => {
      await helpers.Blockchain.mockGetBlockchainNodesWalletMethod({}, false);
      await helpers.Blockchain.updateBlockchainNodes();

      const data = await helpers.Blockchain.requestToGetNodesList(userVlad, false, 200, '?&search=_sUp');

      const expectedTitles = [
        'z_super_new1',
        'z_super_new2',
      ];

      expect(data.length).toBe(expectedTitles.length);

      expectedTitles.forEach(title => {
        expect(data.some(data => data.title === title)).toBeTruthy();
      });
    });

    it('should find nothing because nothing matches search request', async () => {
      await helpers.Blockchain.updateBlockchainNodes();
      const data = await helpers.Blockchain.requestToGetNodesList(userVlad, false, 200, '?&search=not_exists', true);

      expect(data.length).toBe(0);
    });
  });

  describe('Negative', () => {
    it('Not possible to ask for myself_bp_vote=true without auth token', async () => {
      await helpers.Blockchain.requestToGetNodesList(null, true, 403);
    });
  });
});
